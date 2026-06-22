import React, { useState, useEffect } from 'react';
import { Upload, X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import api from '../services/api';
import type { Category } from '../services/api';

interface CsvImporterProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Mappings {
  date: number;
  description: number;
  amount: number;
  category: number;
}

interface NormalizedRow {
  id: string; // React key
  originalIndex: number;
  date: string;
  description: string;
  amount: string; // stored as string for input editing
  type: 'income' | 'expense';
  categoryId: string; // stored as string to map to select value
  originalCategoryValue: string;
  dateInvalid: boolean;
  amountInvalid: boolean;
}

const parseCsv = (text: string): string[][] => {
  const lines: string[][] = [];
  const rows = text.split(/\r?\n/);
  for (const row of rows) {
    if (!row.trim()) continue;
    const cols: string[] = [];
    let insideQuotes = false;
    let current = '';
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if ((char === ',' || char === ';') && !insideQuotes) {
        cols.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.replace(/^"|"$/g, '').trim());
    lines.push(cols);
  }
  return lines;
};

const normalizeDate = (val: string): string => {
  if (!val) return '';
  let clean = val.trim();
  
  // If there's a space or 'T', take the first part (date part)
  const spaceIdx = clean.indexOf(' ');
  const tIdx = clean.indexOf('T');
  if (spaceIdx > 0) {
    clean = clean.substring(0, spaceIdx);
  } else if (tIdx > 0) {
    clean = clean.substring(0, tIdx);
  }
  
  // Match YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  
  // Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const parts = clean.split(/[/\-.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (parts[2].length === 4) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
    if (parts[2].length <= 2) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const yy = parseInt(parts[2]);
      const y = yy <= 50 ? 2000 + yy : 1900 + yy;
      return `${y}-${m}-${d}`;
    }
  }
  
  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch (e) {}
  
  return '';
};

const normalizeAmount = (val: string): { amount: number; type: 'income' | 'expense' } | null => {
  if (!val) return null;
  let clean = val.trim().replace(/[$\s€]/g, '');
  
  const isNegative = clean.startsWith('-') || clean.endsWith('-') || (clean.startsWith('(') && clean.endsWith(')'));
  clean = clean.replace(/[()\-+]/g, '');
  
  const commaIdx = clean.lastIndexOf(',');
  const dotIdx = clean.lastIndexOf('.');
  
  if (commaIdx > dotIdx) {
    clean = clean.replace(/\./g, '').replace(/,/g, '.');
  } else if (dotIdx > commaIdx) {
    clean = clean.replace(/,/g, '');
  }
  
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return null;
  
  return {
    amount: parsed,
    type: isNegative ? 'expense' : 'income'
  };
};

const CsvImporter: React.FC<CsvImporterProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [mappings, setMappings] = useState<Mappings>({
    date: -1,
    description: -1,
    amount: -1,
    category: -1,
  });

  const [normalizedRows, setNormalizedRows] = useState<NormalizedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Try auto-mapping columns when parsed data or header option changes
  useEffect(() => {
    if (parsedData.length === 0) return;
    const firstRow = parsedData[0];
    const newMappings: Mappings = { date: -1, description: -1, amount: -1, category: -1 };

    firstRow.forEach((col, idx) => {
      const cleanCol = col.toLowerCase().trim();
      if (cleanCol.includes('fecha') || cleanCol.includes('date') || cleanCol.includes('day') || cleanCol.includes('dia')) {
        if (newMappings.date === -1) newMappings.date = idx;
      } else if (cleanCol.includes('descrip') || cleanCol.includes('concepto') || cleanCol.includes('detalle') || cleanCol.includes('glosa') || cleanCol.includes('nota')) {
        if (newMappings.description === -1) newMappings.description = idx;
      } else if (cleanCol.includes('monto') || cleanCol.includes('valor') || cleanCol.includes('importe') || cleanCol.includes('amount') || cleanCol.includes('cantidad') || cleanCol.includes('total')) {
        if (newMappings.amount === -1) newMappings.amount = idx;
      } else if (cleanCol.includes('categor') || cleanCol.includes('grupo') || cleanCol.includes('tag') || cleanCol.includes('tipo')) {
        if (newMappings.category === -1) newMappings.category = idx;
      }
    });

    // Fallback simple defaults if not matched
    if (newMappings.date === -1 && firstRow.length > 0) newMappings.date = 0;
    if (newMappings.description === -1 && firstRow.length > 1) newMappings.description = 1;
    if (newMappings.amount === -1 && firstRow.length > 2) newMappings.amount = 2;
    if (newMappings.category === -1 && firstRow.length > 3) newMappings.category = 3;

    setMappings(newMappings);
  }, [parsedData, hasHeaders]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        alert('Por favor selecciona un archivo con extensión .csv');
      }
    }
  };

  const handleParseFile = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        alert('El archivo CSV está vacío.');
        return;
      }
      setParsedData(parsed);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleProceedToReview = () => {
    if (mappings.date === -1 || mappings.description === -1 || mappings.amount === -1) {
      alert('Por favor mapea los campos requeridos (Fecha, Descripción, Monto)');
      return;
    }

    const startIndex = hasHeaders ? 1 : 0;
    const rowsToProcess = parsedData.slice(startIndex);

    const processed: NormalizedRow[] = rowsToProcess.map((row, index) => {
      const rawDate = row[mappings.date] || '';
      const rawDesc = row[mappings.description] || '';
      const rawAmount = row[mappings.amount] || '';
      const rawCat = mappings.category !== -1 ? row[mappings.category] || '' : '';

      const normalizedD = normalizeDate(rawDate);
      const normalizedA = normalizeAmount(rawAmount);

      // Match category
      let matchedCategoryId = '';
      if (rawCat) {
        const cleanCatName = rawCat.trim().toLowerCase();
        const found = categories.find(c => c.name.toLowerCase().trim() === cleanCatName);
        if (found) {
          matchedCategoryId = found.id.toString();
        }
      }

      return {
        id: `${index}-${Date.now()}`,
        originalIndex: index + startIndex,
        date: normalizedD,
        description: rawDesc.trim(),
        amount: normalizedA ? normalizedA.amount.toString() : rawAmount.trim(),
        type: normalizedA ? normalizedA.type : 'expense',
        categoryId: matchedCategoryId,
        originalCategoryValue: rawCat,
        dateInvalid: !normalizedD || !/^\d{4}-\d{2}-\d{2}$/.test(normalizedD),
        amountInvalid: !normalizedA || isNaN(normalizedA.amount) || normalizedA.amount <= 0,
      };
    });

    setNormalizedRows(processed);
    setStep(3);
  };

  const handleRowChange = (id: string, field: keyof NormalizedRow, value: any) => {
    setNormalizedRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        
        const updatedRow = { ...row, [field]: value };

        // Revalidate date
        if (field === 'date') {
          updatedRow.dateInvalid = !value || !/^\d{4}-\d{2}-\d{2}$/.test(value);
        }
        
        // Revalidate amount
        if (field === 'amount') {
          const parsed = parseFloat(value);
          updatedRow.amountInvalid = isNaN(parsed) || parsed <= 0;
        }

        return updatedRow;
      })
    );
  };

  const handleImport = async () => {
    // Check if any invalid items remain
    const hasErrors = normalizedRows.some(r => r.dateInvalid || r.amountInvalid);
    if (hasErrors) {
      alert('Por favor corrige todos los campos marcados en rojo antes de proceder.');
      return;
    }

    setImporting(true);
    setStep(4);

    const payload = normalizedRows.map(row => ({
      amount: parseFloat(row.amount),
      transaction_type: row.type,
      category_id: row.categoryId ? parseInt(row.categoryId) : null,
      description: row.description || 'Importado por CSV',
      date: row.date,
    }));

    try {
      const res = await api.createBulkTransactions(payload);
      setImportResult({
        success: true,
        message: '¡Transacciones importadas con éxito!',
        count: res.count || payload.length,
      });
      onSuccess();
    } catch (err: any) {
      console.error('Error importing bulk transactions:', err);
      setImportResult({
        success: false,
        message: err.message || 'Error inesperado al procesar las transacciones.',
      });
    } finally {
      setImporting(false);
    }
  };

  const hasValidationErrors = normalizedRows.some(r => r.dateInvalid || r.amountInvalid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all scale-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Centro de Transacciones Avanzado</h3>
            <p className="text-xs text-slate-500">Importa tus movimientos desde un archivo CSV</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps Breadcrumb */}
        <div className="flex justify-between items-center px-8 py-4 bg-slate-50 border-b border-slate-100">
          {[
            { num: 1, label: 'Subir Archivo' },
            { num: 2, label: 'Mapear Columnas' },
            { num: 3, label: 'Revisar y Corregir' },
            { num: 4, label: 'Resultado' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.num 
                  ? 'bg-[#4D5DFB] text-white ring-4 ring-indigo-100'
                  : step > s.num 
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${
                step === s.num ? 'text-slate-800' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
              {s.num < 4 && <div className="w-8 sm:w-16 h-[2px] bg-slate-200 mx-2" />}
            </div>
          ))}
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="flex flex-col items-center py-6">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('csv-file-picker')?.click()}
                className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragOver 
                    ? 'border-[#4D5DFB] bg-indigo-50/50' 
                    : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input 
                  id="csv-file-picker"
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <Upload size={48} className="text-[#4D5DFB] mb-4 animate-bounce" />
                <h4 className="text-slate-800 font-bold mb-1 text-center">Selecciona tu archivo de transacciones</h4>
                <p className="text-slate-400 text-xs mb-6 text-center">Formatos soportados: .csv (delimitado por coma o punto y coma)</p>
                <button className="bg-[#4D5DFB] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-600 transition-colors">
                  Buscar Archivo
                </button>
              </div>

              {file && (
                <div className="w-full max-w-xl mt-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                      CSV
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 truncate max-w-[250px] sm:max-w-xs">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1.5"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Mappings */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-800">Asocia tus Columnas</h4>
                  <p className="text-xs text-slate-500">Indica a qué campo corresponde cada columna del archivo CSV.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={hasHeaders} 
                    onChange={(e) => setHasHeaders(e.target.checked)}
                    className="w-4 h-4 text-[#4D5DFB] border-slate-300 rounded focus:ring-[#4D5DFB]"
                  />
                  <span className="text-xs font-bold text-slate-700">La primera fila contiene encabezados</span>
                </label>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vista previa de datos cargados</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {parsedData[0]?.map((_, index) => (
                          <th key={index} className="px-4 py-2 text-xs font-bold text-slate-500 border-r border-slate-100 last:border-0">
                            Columna {index} {hasHeaders && parsedData[0] ? `("${parsedData[0][index]}")` : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(hasHeaders ? 1 : 0, hasHeaders ? 4 : 3).map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-4 py-2 text-xs text-slate-600 border-r border-slate-100 last:border-0 truncate max-w-[150px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Column Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mt-2">
                {[
                  { key: 'date', label: 'Fecha (Requerido)*', helper: 'Formato YYYY-MM-DD, DD/MM/YYYY, etc.' },
                  { key: 'description', label: 'Descripción (Requerido)*', helper: 'Nombre o concepto de la transacción' },
                  { key: 'amount', label: 'Monto (Requerido)*', helper: 'Valor numérico. Negativos serán Gastos, positivos Ingresos.' },
                  { key: 'category', label: 'Categoría (Opcional)', helper: 'Se intentará auto-asociar por texto' },
                ].map((field) => (
                  <div key={field.key} className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700">{field.label}</label>
                    <select
                      value={mappings[field.key as keyof Mappings]}
                      onChange={(e) => setMappings(prev => ({ ...prev, [field.key]: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#4D5DFB]/20 focus:border-[#4D5DFB] transition-all cursor-pointer"
                    >
                      <option value="-1">-- Seleccionar Columna --</option>
                      {parsedData[0]?.map((col, index) => (
                        <option key={index} value={index}>
                          Columna {index}: {hasHeaders ? col : `Fila 1: ${col.slice(0, 15)}...`}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400">{field.helper}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Review and correct */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-800">Revisión de Transacciones</h4>
                  <p className="text-xs text-slate-500">Valida los datos y asigna las categorías correspondientes.</p>
                </div>
                <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-1.5 text-xs font-semibold">
                  <Info size={14} /> Total filas: {normalizedRows.length}
                </div>
              </div>

              {hasValidationErrors && (
                <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2.5 text-xs animate-pulse">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Hay errores de validación.</span> Por favor, corrige los campos con borde rojo. Revisa que las fechas estén bien estructuradas y que los montos sean números positivos.
                  </div>
                </div>
              )}

              {/* Edit Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col max-h-[380px]">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-600">Fila CSV</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-600 min-w-[140px]">Fecha (YYYY-MM-DD)*</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-600 min-w-[200px]">Descripción</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-600 min-w-[120px]">Monto*</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-600 min-w-[100px]">Tipo</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-600 min-w-[180px]">Categoría Mapeada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {normalizedRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/40">
                          {/* Fila CSV original */}
                          <td className="px-4 py-2 text-xs font-bold text-slate-500">
                            #{row.originalIndex + 1}
                          </td>

                          {/* Fecha */}
                          <td className="px-4 py-2">
                            <input 
                              type="date"
                              value={row.date}
                              onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                              className={`w-full px-2 py-1 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#4D5DFB] ${
                                row.dateInvalid 
                                  ? 'border-red-400 bg-red-50 text-red-800 focus:ring-red-400' 
                                  : 'border-slate-200 text-slate-700'
                              }`}
                            />
                          </td>

                          {/* Descripción */}
                          <td className="px-4 py-2">
                            <input 
                              type="text"
                              value={row.description}
                              onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4D5DFB]"
                            />
                          </td>

                          {/* Monto */}
                          <td className="px-4 py-2">
                            <input 
                              type="text"
                              value={row.amount}
                              onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                              placeholder="Ej: 1500.50"
                              className={`w-full px-2 py-1 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#4D5DFB] ${
                                row.amountInvalid 
                                  ? 'border-red-400 bg-red-50 text-red-800 focus:ring-red-400' 
                                  : 'border-slate-200 text-slate-700'
                              }`}
                            />
                          </td>

                          {/* Tipo */}
                          <td className="px-4 py-2">
                            <select
                              value={row.type}
                              onChange={(e) => handleRowChange(row.id, 'type', e.target.value)}
                              className="w-full px-1.5 py-1 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4D5DFB] cursor-pointer"
                            >
                              <option value="income">Ingreso</option>
                              <option value="expense">Gasto</option>
                            </select>
                          </td>

                          {/* Categoría */}
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-1">
                              <select
                                value={row.categoryId}
                                onChange={(e) => handleRowChange(row.id, 'categoryId', e.target.value)}
                                className="w-full px-1.5 py-1 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4D5DFB] cursor-pointer"
                              >
                                <option value="">-- Sin categoría (null) --</option>
                                {categories.map(c => (
                                  <option key={c.id} value={c.id.toString()}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                              {row.originalCategoryValue && !row.categoryId && (
                                <span className="text-[9px] text-slate-400 italic">
                                  Valor original: "{row.originalCategoryValue}"
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Submitting & Result */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-10 min-h-[300px]">
              {importing ? (
                <>
                  <Loader2 className="animate-spin text-[#4D5DFB] mb-4" size={48} />
                  <h4 className="text-slate-800 font-bold mb-1 text-center">Importando transacciones</h4>
                  <p className="text-slate-400 text-xs text-center">Estamos guardando los registros en la base de datos de manera atómica...</p>
                </>
              ) : importResult ? (
                <div className="flex flex-col items-center text-center">
                  {importResult.success ? (
                    <>
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 border-4 border-emerald-50">
                        <CheckCircle2 size={36} />
                      </div>
                      <h4 className="text-slate-800 font-bold text-lg mb-1">{importResult.message}</h4>
                      <p className="text-slate-500 text-sm max-w-md mb-6">
                        Se importaron correctamente <span className="font-bold text-emerald-600">{importResult.count}</span> transacciones a tu panel financiero.
                      </p>
                      <button 
                        onClick={onClose}
                        className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-emerald-600 transition-colors"
                      >
                        Finalizar y Cerrar
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 border-4 border-red-50">
                        <AlertCircle size={36} />
                      </div>
                      <h4 className="text-slate-800 font-bold text-lg mb-1">No se pudo realizar la importación</h4>
                      <p className="text-slate-500 text-sm max-w-md mb-2">
                        La base de datos rechazó el bloque de transacciones.
                      </p>
                      <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-100 text-xs text-left max-w-lg mb-6 max-h-40 overflow-y-auto font-mono">
                        {importResult.message}
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setStep(3)}
                          className="bg-slate-100 text-slate-700 px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                        >
                          Volver a Revisar
                        </button>
                        <button 
                          onClick={onClose}
                          className="bg-red-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-red-600 transition-colors"
                        >
                          Cerrar Modal
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 4 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            {step > 1 ? (
              <button
                onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <ChevronLeft size={16} /> Atrás
              </button>
            ) : (
              <div />
            )}

            {step === 1 && (
              <button
                onClick={handleParseFile}
                disabled={!file}
                className="flex items-center gap-1.5 bg-[#4D5DFB] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar <ChevronRight size={16} />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleProceedToReview}
                disabled={mappings.date === -1 || mappings.description === -1 || mappings.amount === -1}
                className="flex items-center gap-1.5 bg-[#4D5DFB] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analizar y Revisar <ChevronRight size={16} />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleImport}
                disabled={hasValidationErrors}
                className="flex items-center gap-1.5 bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Realizar Importación ({normalizedRows.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvImporter;
