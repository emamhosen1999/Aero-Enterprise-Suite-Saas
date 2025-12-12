import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Card,
  Chip,
  Avatar,
  Kbd,
  ScrollShadow,
  Divider
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  CommandLineIcon,
  HomeIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Command Palette Component (⌘K / Ctrl+K)
 * Global search and navigation for instant access to any page/action
 * 
 * Features:
 * - Fuzzy search across all navigation items
 * - Recent pages history
 * - Keyboard shortcuts (↑↓ Enter Esc)
 * - Action execution
 * - Smart categorization
 * 
 * @author Aero Enterprise Suite Team
 * @version 1.0.0
 */
const CommandPalette = ({ isOpen, onClose, pages = [] }) => {
  const { auth } = usePage().props;
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentPages, setRecentPages] = useState([]);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Load recent pages from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('command_palette_recent');
      if (stored) {
        setRecentPages(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load recent pages from localStorage:', error);
    }
  }, []);

  // Save to recent pages
  const addToRecent = useCallback((item) => {
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.path !== item.path);
      const updated = [item, ...filtered].slice(0, 10); // Keep last 10
      try {
        localStorage.setItem('command_palette_recent', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save recent pages to localStorage:', error);
      }
      return updated;
    });
  }, []);

  // Flatten navigation tree for search
  const flattenPages = useCallback((pagesList, category = 'main', parentName = '') => {
    const flattened = [];
    
    pagesList.forEach(page => {
      // Add parent page if it has a path
      if (page.path) {
        flattened.push({
          ...page,
          category: page.category || category,
          fullPath: parentName ? `${parentName} > ${page.name}` : page.name,
          searchText: `${page.name} ${parentName} ${page.category || category}`.toLowerCase()
        });
      }
      
      // Recursively add children
      if (page.subMenu && page.subMenu.length > 0) {
        const childCategory = page.category || category;
        const childParent = parentName ? `${parentName} > ${page.name}` : page.name;
        flattened.push(...flattenPages(page.subMenu, childCategory, childParent));
      }
    });
    
    return flattened;
  }, []);

  // Get all searchable items
  const allItems = useMemo(() => flattenPages(pages), [pages, flattenPages]);

  // Fuzzy search implementation
  const searchItems = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const words = query.split(' ').filter(Boolean);
    
    return allItems
      .map(item => {
        // Calculate relevance score
        let score = 0;
        const searchText = item.searchText;
        
        // Exact match bonus
        if (searchText.includes(query)) {
          score += 100;
        }
        
        // Individual word matches
        words.forEach(word => {
          if (searchText.includes(word)) {
            score += 10;
          }
          // Start of word bonus
          if (searchText.match(new RegExp(`\\b${word}`, 'i'))) {
            score += 5;
          }
        });
        
        // Name match bonus (more important than category)
        if (item.name.toLowerCase().includes(query)) {
          score += 50;
        }
        
        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10 results
  }, [allItems]);

  // Current results
  const results = useMemo(() => {
    if (!query.trim()) {
      return recentPages;
    }
    return searchItems(query);
  }, [query, searchItems, recentPages]);

  // Handle item selection
  const handleSelect = useCallback((item) => {
    if (item.path) {
      addToRecent(item);
      // Use Inertia router with direct path
      router.visit(item.path, {
        method: item.method || 'get',
        preserveState: false,
        preserveScroll: false
      });
      onClose();
      setQuery('');
    }
  }, [addToRecent, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          setQuery('');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelect, onClose]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, results]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Use requestAnimationFrame to ensure focus occurs after modal DOM is fully rendered
      // This is more reliable than setTimeout as it synchronizes with browser render cycles
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'main': return <HomeIcon className="w-4 h-4" />;
      case 'settings': return <CommandLineIcon className="w-4 h-4" />;
      case 'admin': return <FolderIcon className="w-4 h-4" />;
      default: return <FolderIcon className="w-4 h-4" />;
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'main': return 'primary';
      case 'settings': return 'warning';
      case 'admin': return 'danger';
      default: return 'default';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setQuery('');
      }}
      size="3xl"
      placement="top"
      backdrop="blur"
      classNames={{
        base: "mt-20",
        wrapper: "overflow-hidden"
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut"
            }
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn"
            }
          }
        }
      }}
    >
      <ModalContent
        style={{
          backgroundColor: 'var(--theme-content1, #FFFFFF)',
          borderRadius: 'var(--borderRadius, 12px)',
          border: `1px solid var(--theme-divider, #E4E4E7)`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header with Search Input */}
        <ModalHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center gap-3">
            <MagnifyingGlassIcon 
              className="w-5 h-5" 
              style={{ color: 'var(--theme-primary, #006FEE)' }}
            />
            <Input
              ref={inputRef}
              placeholder="Search for pages, modules, or actions..."
              value={query}
              onValueChange={setQuery}
              variant="flat"
              classNames={{
                input: "text-lg",
                inputWrapper: "shadow-none border-none bg-transparent px-0"
              }}
              autoFocus
            />
            <Kbd keys={["escape"]}>ESC</Kbd>
          </div>
        </ModalHeader>

        <Divider />

        {/* Results Body */}
        <ModalBody className="py-4">
          {/* Empty State */}
          {results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              {query.trim() ? (
                <>
                  <MagnifyingGlassIcon className="w-12 h-12 text-default-300 mb-3" />
                  <p className="text-default-500 font-medium">No results found</p>
                  <p className="text-default-400 text-sm mt-1">
                    Try different keywords or check spelling
                  </p>
                </>
              ) : (
                <>
                  <ClockIcon className="w-12 h-12 text-default-300 mb-3" />
                  <p className="text-default-500 font-medium">Start typing to search</p>
                  <p className="text-default-400 text-sm mt-1">
                    Search across all modules and pages
                  </p>
                </>
              )}
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-2 mb-2">
                {!query.trim() ? (
                  <ClockIcon className="w-4 h-4 text-default-400" />
                ) : (
                  <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
                )}
                <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">
                  {!query.trim() ? 'Recent Pages' : `${results.length} Result${results.length === 1 ? '' : 's'}`}
                </span>
              </div>

              <ScrollShadow className="max-h-[400px]" hideScrollBar>
                <div ref={resultsRef} className="space-y-1">
                  {results.map((item, index) => (
                    <motion.div
                      key={`${item.path || item.name}-${index}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <Card
                        isPressable
                        onPress={() => handleSelect(item)}
                        className={`transition-all duration-200 ${
                          selectedIndex === index
                            ? 'bg-primary/10 border-primary/50'
                            : 'hover:bg-default-100'
                        }`}
                        style={{
                          borderRadius: 'var(--borderRadius, 8px)',
                          border: selectedIndex === index 
                            ? `2px solid var(--theme-primary, #006FEE)`
                            : `1px solid var(--theme-divider, #E4E4E7)`
                        }}
                      >
                        <div className="flex items-center gap-3 p-3">
                          {/* Icon */}
                          <div 
                            className="flex items-center justify-center w-10 h-10 rounded-lg"
                            style={{
                              // Using color-mix() for theme-aware transparency (requires Chrome 111+, Firefox 113+, Safari 16.2+)
                              // Falls back to content2 background for older browsers
                              backgroundColor: selectedIndex === index
                                ? 'color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent)'
                                : 'var(--theme-content2, #F4F4F5)',
                              color: 'var(--theme-primary, #006FEE)'
                            }}
                          >
                            {item.icon || <FolderIcon className="w-5 h-5" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">
                                {item.name}
                              </p>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={getCategoryColor(item.category)}
                                startContent={getCategoryIcon(item.category)}
                                className="text-xs"
                              >
                                {item.category}
                              </Chip>
                            </div>
                            <p className="text-xs text-default-500 truncate mt-0.5">
                              {item.fullPath}
                            </p>
                          </div>

                          {/* Action Hint */}
                          {selectedIndex === index && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-2"
                            >
                              <Kbd keys={["enter"]}>↵</Kbd>
                              <ArrowRightIcon className="w-4 h-4 text-primary" />
                            </motion.div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollShadow>
            </>
          )}
        </ModalBody>

        {/* Footer with Tips */}
        <Divider />
        <div className="px-4 py-3 bg-default-50">
          <div className="flex items-center justify-between text-xs text-default-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Kbd keys={["up", "down"]}>↑↓</Kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd keys={["enter"]}>↵</Kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd keys={["escape"]}>ESC</Kbd>
                <span>Close</span>
              </span>
            </div>
            <span className="text-default-400">
              Tip: Use keyboard shortcuts for faster navigation
            </span>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default CommandPalette;
