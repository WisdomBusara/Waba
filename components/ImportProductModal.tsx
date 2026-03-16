import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGridIcon, StarIcon, XIcon, ChevronDownIcon } from './icons';

const Stepper = ({ currentStep }: { currentStep: number }) => {
    const steps = ['Product Supplier', 'Details Mapping', 'Details Review'];
    return (
        <div className="flex items-center w-full">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isActive = stepNumber === currentStep;
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                                isActive ? 'bg-orange-500 text-white' : 
                                isCompleted ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'
                            }`}>
                                {isCompleted ? '✓' : stepNumber}
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-auto border-t-2 transition-colors duration-300 mx-4 ${isCompleted || isActive ? 'border-green-500' : 'border-slate-200 dark:border-slate-600'}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// FIX: Changed to React.FC to correctly type component with children and resolve parsing issue.
const CollapsibleSection: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 border-t border-slate-200 dark:border-slate-700">{children}</div>}
        </div>
    );
};


const ImportProductModal = ({ product, onClose, showToast }: { product: any, onClose: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) => {
    const [tags, setTags] = useState(product.tags || ['Apple', 'Electronic']);

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag: string) => tag !== tagToRemove));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        showToast('Product imported successfully!', 'success');
        onClose();
    };

    return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 flex-1 overflow-hidden">
            {/* Left Column */}
            <div className="lg:col-span-3 p-8 overflow-y-auto">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <LayoutGridIcon className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import Product</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Effortlessly import products and update your inventory.</p>
                </div>
              </div>

              <div className="my-8">
                <Stepper currentStep={3} />
              </div>

              <h3 className="text-lg font-bold mb-4">Details Review</h3>

              <form className="space-y-6" onSubmit={handleFormSubmit}>
                  <CollapsibleSection title="Supplier" defaultOpen>
                      <div className="flex items-center gap-4">
                        <img src={product.supplier.logo} alt={product.supplier.name} className="w-12 h-12 rounded-full bg-orange-100" />
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{product.supplier.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{product.supplier.description}</p>
                        </div>
                      </div>
                  </CollapsibleSection>
                  <CollapsibleSection title="Data Mapping" defaultOpen>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Name</label>
                            <input type="text" defaultValue="Personal Wood Box" className="mt-1 w-full input-field" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                            <select className="mt-1 w-full input-field">
                                <option>Electronic</option>
                                <option>Fashion</option>
                                <option>Home Goods</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Selling Cost</label>
                            <input type="text" defaultValue="$1,456" className="mt-1 w-full input-field" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cost Price</label>
                            <input type="text" defaultValue="$1,987" className="mt-1 w-full input-field" />
                        </div>
                        <div>
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Shipping Cost</label>
                             <input type="text" defaultValue="$46" className="mt-1 w-full input-field" />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stock Level</label>
                            <input type="text" defaultValue="50" className="mt-1 w-full input-field" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
                            <div className="mt-1 flex flex-wrap gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg">
                                {tags.map((tag: string) => (
                                <span key={tag} className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 text-sm px-2 py-1 rounded">
                                    {tag}
                                    <button onClick={() => handleRemoveTag(tag)} type="button">
                                        <XIcon className="w-3 h-3"/>
                                    </button>
                                </span>
                                ))}
                            </div>
                        </div>
                         <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Description</label>
                            <textarea rows={3} className="mt-1 w-full input-field" defaultValue={product.description}></textarea>
                        </div>
                    </div>
                  </CollapsibleSection>
                  <p className="text-sm text-center text-slate-500">Learn more about <a href="#" className="text-blue-500 font-medium">Import Product</a></p>
              </form>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Product detail</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <XIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="space-y-4">
                    <img src={product.image} alt={product.name} className="rounded-lg w-full aspect-square object-cover" />
                    <h4 className="text-lg font-bold">{product.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1 text-yellow-500">
                            <StarIcon className="w-4 h-4" />
                            <span className="font-bold text-slate-800 dark:text-slate-200">{product.rating}</span> ({product.reviews})
                        </div>
                        <div>SKU: {product.sku}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag: string) => (
                             <span key={tag} className="bg-slate-200 dark:bg-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Platform</span> <span className="font-medium text-slate-800 dark:text-slate-200">{product.platform}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Price</span> <span className="font-medium text-slate-800 dark:text-slate-200">{product.price}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Minimum Order</span> <span className="font-medium text-slate-800 dark:text-slate-200">{product.minOrder}</span></div>
                    </div>
                    <div>
                        <h5 className="font-semibold text-sm mb-1">Description</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{product.description}</p>
                    </div>
                </div>
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center gap-4 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={handleFormSubmit} className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600">Submit</button>
          </div>
        </motion.div>
        <style>{`.input-field { display: block; width: 100%; border-radius: 0.5rem; border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 0.5rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; } .dark .input-field { background-color: #334155; border-color: #475569; }`}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImportProductModal;