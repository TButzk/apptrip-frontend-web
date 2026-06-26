import { type ChangeEvent, type PointerEvent, useRef } from "react";

import { MaterialIcon } from "./MaterialIcon";

type CaptureInputBarProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  noteReady: boolean;
  recordingAudio?: boolean;
  onAddClick: () => void;
  onMicClick?: () => void;
  onMicPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  onMicPointerUp?: (event?: PointerEvent<HTMLButtonElement>) => void;
  onCameraClick: () => void;
  onEnterSubmit?: () => void;
  onAttachmentPick: (file: File) => void;
  onPhotoPick: (file: File) => void;
};

export function CaptureInputBar({
  value,
  onChange,
  disabled = false,
  noteReady,
  recordingAudio = false,
  onAddClick,
  onMicClick,
  onMicPointerDown,
  onMicPointerUp,
  onCameraClick,
  onEnterSubmit,
  onAttachmentPick,
  onPhotoPick
}: CaptureInputBarProps) {
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onAttachmentPick(file);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPhotoPick(file);
  }

  return (
    <div className={`capture-input-bar${disabled ? " disabled" : ""}`}>
      <button
        type="button"
        className="capture-input-add"
        aria-label={noteReady ? "Publicar nota" : "Anexar mídia"}
        disabled={disabled}
        onClick={() => {
          if (noteReady) {
            onAddClick();
            return;
          }
          attachmentInputRef.current?.click();
        }}
      >
        <MaterialIcon name="add" size={22} />
      </button>
      <input
        type="text"
        value={value}
        placeholder="Algo incrível aconteceu aqui?"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onEnterSubmit?.();
        }}
      />
      <button
        type="button"
        className={`capture-input-icon${noteReady ? " send" : ""}${recordingAudio ? " recording" : ""}`}
        aria-label={noteReady ? "Enviar nota" : "Gravar áudio"}
        aria-pressed={recordingAudio}
        disabled={disabled}
        onPointerDown={onMicPointerDown}
        onPointerUp={onMicPointerUp}
        onPointerLeave={onMicPointerUp}
        onPointerCancel={onMicPointerUp}
        onClick={onMicClick}
      >
        <MaterialIcon name={noteReady ? "send" : "mic"} size={20} />
      </button>
      <button
        type="button"
        className="capture-input-icon"
        aria-label="Tirar foto"
        disabled={disabled}
        onClick={() => {
          onCameraClick();
          photoInputRef.current?.click();
        }}
      >
        <MaterialIcon name="photo_camera" size={20} />
      </button>
      <input
        ref={attachmentInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        hidden
        onChange={handleAttachmentChange}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handlePhotoChange}
      />
    </div>
  );
}
