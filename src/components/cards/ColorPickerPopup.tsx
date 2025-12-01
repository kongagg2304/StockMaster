import React from 'react';
import { COLOR_PALETTE } from '../../lib/constants';
import type { ColorKey } from '../../lib/types';

interface Props {
  onSelect: (c: ColorKey) => void;
  onClose: () => void;
}

const ColorPickerPopup: React.FC<Props> = ({ onSelect, onClose }) => {
  return (
    <div 
      className="absolute top-8 right-0 bg-white shadow-xl border border-slate-200 p-2 rounded-lg z-[60] grid grid-cols-5 gap-1 w-[130px]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {(Object.keys(COLOR_PALETTE) as ColorKey[]).map(key => (
        <button
          key={key}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(key);
            onClose();
          }}
          className={`w-5 h-5 rounded-full ${COLOR_PALETTE[key].dot} hover:scale-110 transition-transform border border-slate-100 shadow-sm`}
          title={COLOR_PALETTE[key].name}
        />
      ))}
      <button 
        onClick={(e) => { e.stopPropagation(); onSelect(undefined as any); onClose(); }}
        className="col-span-5 text-[10px] text-slate-400 hover:text-red-500 mt-1 text-center"
      >
        Usuń kolor
      </button>
    </div>
  );
};

export default ColorPickerPopup;