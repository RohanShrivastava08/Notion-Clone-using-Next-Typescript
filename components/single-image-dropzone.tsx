'use client';

import { formatFileSize } from '@edgestore/react/utils';
import { UploadCloudIcon, X } from 'lucide-react';
import * as React from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { twMerge } from 'tailwind-merge';
import Image from 'next/image'; // Import Next.js Image component

import { Spinner } from './spinner';

const variants = {
  base: 'relative rounded-md flex justify-center items-center flex-col cursor-pointer min-h-[150px] min-w-[200px] border border-dashed border-gray-400 dark:border-gray-300 transition-colors duration-200 ease-in-out',
  image: 'border-0 p-0 min-h-0 min-w-0 relative shadow-md bg-slate-200 dark:bg-slate-900 rounded-md',
  active: 'border-2',
  disabled: 'bg-gray-200 border-gray-300 cursor-default pointer-events-none bg-opacity-30 dark:bg-gray-700',
  accept: 'border border-blue-500 bg-blue-500 bg-opacity-10',
  reject: 'border border-red-700 bg-red-700 bg-opacity-10',
};

type InputProps = {
  width?: number;
  height?: number;
  className?: string;
  value?: File | string;
  onChange?: (file?: File) => void | Promise<void>;
  disabled?: boolean;
  dropzoneOptions?: Omit<DropzoneOptions, 'disabled'>;
};

const ERROR_MESSAGES = {
  fileTooLarge: (maxSize: number) => `The file is too large. Max size is ${formatFileSize(maxSize)}.`,
  fileInvalidType: () => 'Invalid file type.',
  tooManyFiles: (maxFiles: number) => `You can only add ${maxFiles} file(s).`,
  fileNotSupported: () => 'The file is not supported.',
};

const SingleImageDropzone = React.forwardRef<HTMLInputElement, InputProps>(
  ({ dropzoneOptions, width, height, value, className, disabled, onChange }, ref) => {
    const imageUrl = React.useMemo(() => {
      if (typeof value === 'string') {
        return value; // Use URL directly if passed as string
      } else if (value) {
        return URL.createObjectURL(value); // Create a URL for the file
      }
      return null; // No image
    }, [value]);

    // Configure the dropzone
    const {
      getRootProps,
      getInputProps,
      acceptedFiles,
      fileRejections,
      isFocused,
      isDragAccept,
      isDragReject,
    } = useDropzone({
      accept: { 'image/*': [] },
      multiple: false,
      disabled,
      onDrop: (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
          void onChange?.(file); // Pass the file to the onChange handler
        }
      },
      ...dropzoneOptions,
    });

    // Construct the drop zone class name based on various states
    const dropZoneClassName = React.useMemo(
      () =>
        twMerge(
          variants.base,
          isFocused && variants.active,
          disabled && variants.disabled,
          imageUrl && variants.image,
          (isDragReject || (fileRejections.length > 0 && fileRejections[0])) && variants.reject,
          isDragAccept && variants.accept,
          className,
        ).trim(),
      [
        isFocused,
        imageUrl,
        fileRejections,
        isDragAccept,
        isDragReject,
        disabled,
        className,
      ],
    );

    // Determine error message based on file rejections
    const errorMessage = React.useMemo(() => {
      if (fileRejections.length > 0) {
        const { errors } = fileRejections[0];
        switch (errors[0]?.code) {
          case 'file-too-large':
            return ERROR_MESSAGES.fileTooLarge(dropzoneOptions?.maxSize ?? 0);
          case 'file-invalid-type':
            return ERROR_MESSAGES.fileInvalidType();
          case 'too-many-files':
            return ERROR_MESSAGES.tooManyFiles(dropzoneOptions?.maxFiles ?? 0);
          default:
            return ERROR_MESSAGES.fileNotSupported();
        }
      }
      return undefined; // No errors
    }, [fileRejections, dropzoneOptions]);

    return (
      <div className='relative'>
        {disabled && (
          <div className='flex items-center justify-center absolute inset-y-0 h-full w-full bg-background/80 z-50'>
            <Spinner size="lg" />
          </div>
        )}
        <div
          {...getRootProps({
            className: dropZoneClassName,
            style: { width, height },
          })}
        >
          <input ref={ref} {...getInputProps()} /> {/* Main File Input */}

          {imageUrl ? (
            <Image // Use Next.js Image component for image preview
              className="h-full w-full rounded-md object-cover"
              src={imageUrl}
              alt={acceptedFiles[0]?.name}
              layout="fill" // Fill the parent container
              objectFit="cover" // Ensure the image covers the container
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-xs text-gray-400"> {/* Upload Icon */}
              <UploadCloudIcon className="mb-2 h-7 w-7" />
              <div className="text-gray-400">
                Click or Drag file to this area to upload
              </div>
            </div>
          )}

          {imageUrl && !disabled && ( // Remove Image Icon
            <div
              className="group absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 transform"
              onClick={(e) => {
                e.stopPropagation();
                void onChange?.(undefined); // Clear the selected image
              }}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md border border-solid border-gray-500 bg-white transition-all duration-300 hover:h-6 hover:w-6 dark:border-gray-400 dark:bg-black">
                <X className="text-gray-500 dark:text-gray-400" width={16} height={16} />
              </div>
            </div>
          )}
        </div>

        <div className="mt-1 text-xs text-red-500">{errorMessage}</div> {/* Error Text */}
      </div>
    );
  },
);
SingleImageDropzone.displayName = 'SingleImageDropzone';

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      className={twMerge(
        'focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50',
        'border border-gray-400 text-gray-400 shadow hover:bg-gray-100 hover:text-gray-500 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700',
        'h-6 rounded-md px-2 text-xs',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { SingleImageDropzone };
