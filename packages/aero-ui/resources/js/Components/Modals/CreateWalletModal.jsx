import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea
} from "@heroui/react";
import { WalletIcon } from "@heroicons/react/24/outline";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const CreateWalletModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    blockchain: '',
    description: '',
    address: ''
  });
  
  const [errors, setErrors] = useState({});

  // Theme radius helper
  const themeRadius = useThemeRadius();

  // Blockchain options
  const blockchains = [
    { key: 'ethereum', label: 'Ethereum (ETH)' },
    { key: 'bitcoin', label: 'Bitcoin (BTC)' },
    { key: 'binance-smart-chain', label: 'Binance Smart Chain (BSC)' },
    { key: 'polygon', label: 'Polygon (MATIC)' },
    { key: 'solana', label: 'Solana (SOL)' },
    { key: 'cardano', label: 'Cardano (ADA)' },
    { key: 'avalanche', label: 'Avalanche (AVAX)' },
    { key: 'polkadot', label: 'Polkadot (DOT)' }
  ];

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Wallet name is required';
    }

    if (!formData.blockchain) {
      newErrors.blockchain = 'Please select a blockchain';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Wallet address is required';
    } else {
      // Basic address validation (can be enhanced for specific blockchain formats)
      if (formData.address.length < 10) {
        newErrors.address = 'Please enter a valid wallet address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error creating wallet:', error);
      // Handle specific errors if needed
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      name: '',
      blockchain: '',
      description: '',
      address: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      isDismissable={!loading}
      isKeyboardDismissDisabled={loading}
      classNames={{
        base: "bg-content1",
        header: "border-b border-divider",
        body: "py-6",
        footer: "border-t border-divider"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <WalletIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create New Wallet</h2>
              <p className="text-sm text-default-500">Add a new blockchain wallet to your account</p>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            {/* Wallet Name */}
            <Input
              label="Wallet Name"
              placeholder="Enter wallet name (e.g., My ETH Wallet)"
              value={formData.name}
              onValueChange={(value) => handleInputChange('name', value)}
              isInvalid={!!errors.name}
              errorMessage={errors.name}
              isRequired
              radius={themeRadius}
              classNames={{
                inputWrapper: "bg-default-100"
              }}
            />

            {/* Blockchain Selection */}
            <Select
              label="Blockchain"
              placeholder="Select blockchain network"
              selectedKeys={formData.blockchain ? [formData.blockchain] : []}
              onSelectionChange={(keys) => handleInputChange('blockchain', Array.from(keys)[0] || '')}
              isInvalid={!!errors.blockchain}
              errorMessage={errors.blockchain}
              isRequired
              radius={themeRadius}
              classNames={{
                trigger: "bg-default-100"
              }}
            >
              {blockchains.map((blockchain) => (
                <SelectItem key={blockchain.key} value={blockchain.key}>
                  {blockchain.label}
                </SelectItem>
              ))}
            </Select>

            {/* Wallet Address */}
            <Input
              label="Wallet Address"
              placeholder="Enter your wallet address"
              value={formData.address}
              onValueChange={(value) => handleInputChange('address', value)}
              isInvalid={!!errors.address}
              errorMessage={errors.address}
              isRequired
              radius={themeRadius}
              classNames={{
                inputWrapper: "bg-default-100"
              }}
              description="This should be your public wallet address, not private key"
            />

            {/* Description (Optional) */}
            <Textarea
              label="Description"
              placeholder="Optional description for this wallet"
              value={formData.description}
              onValueChange={(value) => handleInputChange('description', value)}
              radius={themeRadius}
              classNames={{
                inputWrapper: "bg-default-100"
              }}
              minRows={3}
              maxRows={5}
            />

            {/* Security Note */}
            <div className="p-4 bg-warning-50 border-l-4 border-warning rounded-r-lg">
              <p className="text-sm text-warning-600">
                <strong>Security Note:</strong> Never share your private keys or seed phrases. 
                Only enter your public wallet address here.
              </p>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button 
            variant="flat" 
            onPress={handleClose}
            isDisabled={loading}
            radius={themeRadius}
          >
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={loading}
            radius={themeRadius}
            startContent={!loading ? <WalletIcon className="w-4 h-4" /> : null}
          >
            {loading ? 'Creating...' : 'Create Wallet'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateWalletModal;