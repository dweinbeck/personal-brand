"use client";

import clsx from "clsx";
import { type ReactNode, useCallback, useEffect, useRef } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
} & (
  | { "aria-labelledby": string; "aria-label"?: never }
  | { "aria-label": string; "aria-labelledby"?: never }
);

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  ...ariaProps
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync open/close state with the native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Sync native close events (Escape key) with React state
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [handleClose]);

  // Light dismiss: clicking the backdrop closes the modal
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onKeyDown={undefined}
      className={clsx(
        "max-h-[85vh] w-full max-w-lg rounded-2xl border border-border",
        "bg-surface p-0 shadow-xl",
        "backdrop:bg-black/50",
        className,
      )}
      {...ariaProps}
    >
      {isOpen ? children : null}
    </dialog>
  );
}
