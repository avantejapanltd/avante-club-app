import React, { createContext, useContext, useState } from 'react';

export interface DocItem {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  size: string;
  fileUri: string | null;
  uploadedBy: string;
  targetGroups: string[]; // [] = すべて
}

interface DocumentContextType {
  documents: DocItem[];
  categories: string[];
  addDocument: (doc: Omit<DocItem, 'id'>) => void;
  deleteDocument: (id: string) => void;
  addCategory: (cat: string) => void;
  deleteCategory: (cat: string) => void;
}

const INITIAL_DOCS: DocItem[] = [
  { id: '2', title: '会員規約', category: '規約', updatedAt: '2026/01/15', size: '0.8MB', fileUri: null, uploadedBy: '指導者', targetGroups: [] },
  { id: '3', title: '個人情報同意書', category: '同意書', updatedAt: '2026/01/15', size: '0.5MB', fileUri: null, uploadedBy: '指導者', targetGroups: [] },
  { id: '4', title: 'ユニフォーム注文用紙', category: '注文', updatedAt: '2026/02/01', size: '0.6MB', fileUri: null, uploadedBy: '指導者', targetGroups: [] },
];

const INITIAL_CATEGORIES = ['申込', '規約', '同意書', '注文', 'お知らせ'];

const DocumentContext = createContext<DocumentContextType>({
  documents: [],
  categories: [],
  addDocument: () => {},
  deleteDocument: () => {},
  addCategory: () => {},
  deleteCategory: () => {},
});

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<DocItem[]>(INITIAL_DOCS);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);

  const addDocument = (doc: Omit<DocItem, 'id'>) => {
    setDocuments(prev => [{ ...doc, id: String(Date.now()) }, ...prev]);
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const addCategory = (cat: string) => {
    if (!categories.includes(cat)) setCategories(prev => [...prev, cat]);
  };

  const deleteCategory = (cat: string) => {
    setCategories(prev => prev.filter(c => c !== cat));
  };

  return (
    <DocumentContext.Provider value={{ documents, categories, addDocument, deleteDocument, addCategory, deleteCategory }}>
      {children}
    </DocumentContext.Provider>
  );
}

export const useDocuments = () => useContext(DocumentContext);
