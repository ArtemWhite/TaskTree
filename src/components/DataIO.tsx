import { useRef } from 'react';
import type { AppData } from '../types';

interface Props {
  data: AppData;
  onImport: (json: string) => boolean;
}

export default function DataIO({ data, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasktrecker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const success = onImport(reader.result as string);
      if (success) alert('Данные успешно загружены!');
      else alert('Ошибка: неверный формат файла.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button className="btn-ghost btn-ghost-sm" onClick={handleExport}>
        💾 СОХРАНИТЬ
      </button>
      <button className="btn-ghost btn-ghost-sm" onClick={() => fileRef.current?.click()}>
        📂 ЗАГРУЗИТЬ
      </button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
    </div>
  );
}
