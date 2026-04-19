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
  Textarea,
  Switch,
  Divider,
  Chip
} from "@heroui/react";
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import {
  CurrencyDollarIcon,
  CubeIcon
} from "@heroicons/react/24/outline";

const CreateTokenModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: '18',
    totalSupply: '',
    network: '',
    isMintable: false,
    isBurnable: false,
    isPausable: false,
    description: ''
  });
  
  const [errors, setErrors] = useState({});

  // Theme radius helper
  const themeRadius = useThemeRadius();

  // Network options
  const networks = [
    { key: 'ethereum', label: 'Ethereum Mainnet' },
    { key: 'polygon', label: 'Polygon' },
    { key: 'bsc', label: 'Binance Smart Chain' },
    { key: 'avalanche', label: 'Avalanche' },
    { key: 'goerli', label: 'Goerli Testnet' },
    { key: 'sepolia', label: 'Sepolia Testnet' }
  ];

  // Decimal options
  const decimalsOptions = [
    { key: '18', label: '18 (Standard)' },
    { key: '8', label: '8' },
    { key: '6', label: '6 (Stablecoin)' },
    { key: '0', label: '0 (NFT/Whole numbers)' }
  ];

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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
      newErrors.name = 'Token name is required';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Token symbol is required';
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be 10 characters or less';
    }

    if (!formData.totalSupply || parseFloat(formData.totalSupply) <= 0) {
      newErrors.totalSupply = 'Total supply must be greater than 0';
    }

    if (!formData.network) {
      newErrors.network = 'Please select a network';
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
      console.error('Error creating token:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      name: '',
      symbol: '',
      decimals: '18',
      totalSupply: '',
      network: '',
      isMintable: false,
      isBurnable: false,
      isPausable: false,
      description: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="3xl"
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
              <CurrencyDollarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create New Token</h2>
              <p className="text-sm text-default-500">Deploy a new ERC-20 token to the blockchain</p>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* Token Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Token Name"
                placeholder="My Token"
                value={formData.name}
                onValueChange={(value) => handleInputChange('name', value)}
                isInvalid={!!errors.name}
                errorMessage={errors.name}
                isRequired
                radius={themeRadius}
                classNames={{ inputWrapper: "bg-default-100" }}
              />
              <Input
                label="Token Symbol"
                placeholder="MTK"
                value={formData.symbol}
                onValueChange={(value) => handleInputChange('symbol', value.toUpperCase())}
                isInvalid={!!errors.symbol}
                errorMessage={errors.symbol}
                isRequired
                radius={themeRadius}
                classNames={{ inputWrapper: "bg-default-100" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Total Supply"
                placeholder="1000000"
                type="number"
                value={formData.totalSupply}
                onValueChange={(value) => handleInputChange('totalSupply', value)}
                isInvalid={!!errors.totalSupply}
                errorMessage={errors.totalSupply}
                isRequired
                radius={themeRadius}
                classNames={{ inputWrapper: "bg-default-100" }}
              />
              <Select
                label="Decimals"
                selectedKeys={formData.decimals ? [formData.decimals] : []}
                onSelectionChange={(keys) => handleInputChange('decimals', Array.from(keys)[0] || '18')}
                radius={themeRadius}
                classNames={{ trigger: "bg-default-100" }}
              >
                {decimalsOptions.map((opt) => (
                  <SelectItem key={opt.key}>{opt.label}</SelectItem>
                ))}
              </Select>
            </div>

            <Select
              label="Network"
              placeholder="Select blockchain network"
              selectedKeys={formData.network ? [formData.network] : []}
              onSelectionChange={(keys) => handleInputChange('network', Array.from(keys)[0] || '')}
              isInvalid={!!errors.network}
              errorMessage={errors.network}
              isRequired
              radius={themeRadius}
              classNames={{ trigger: "bg-default-100" }}
              startContent={<CubeIcon className="w-4 h-4 text-default-400" />}
            >
              {networks.map((network) => (
                <SelectItem key={network.key}>{network.label}</SelectItem>
              ))}
            </Select>

            <Divider />

            {/* Token Features */}
            <div>
              <h4 className="text-sm font-medium mb-3">Token Features</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Mintable</p>
                    <p className="text-xs text-default-400">Allow creating new tokens</p>
                  </div>
                  <Switch
                    isSelected={formData.isMintable}
                    onValueChange={(value) => handleInputChange('isMintable', value)}
                    color="primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Burnable</p>
                    <p className="text-xs text-default-400">Allow destroying tokens</p>
                  </div>
                  <Switch
                    isSelected={formData.isBurnable}
                    onValueChange={(value) => handleInputChange('isBurnable', value)}
                    color="primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Pausable</p>
                    <p className="text-xs text-default-400">Allow pausing all transfers</p>
                  </div>
                  <Switch
                    isSelected={formData.isPausable}
                    onValueChange={(value) => handleInputChange('isPausable', value)}
                    color="primary"
                  />
                </div>
              </div>
            </div>

            <Divider />

            <Textarea
              label="Description (Optional)"
              placeholder="Describe your token"
              value={formData.description}
              onValueChange={(value) => handleInputChange('description', value)}
              radius={themeRadius}
              classNames={{ inputWrapper: "bg-default-100" }}
              minRows={3}
            />

            {/* Summary */}
            {formData.name && formData.symbol && formData.totalSupply && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Token Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-default-500">Name:</span> {formData.name}
                  </div>
                  <div>
                    <span className="text-default-500">Symbol:</span> {formData.symbol}
                  </div>
                  <div>
                    <span className="text-default-500">Supply:</span> {parseFloat(formData.totalSupply).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-default-500">Decimals:</span> {formData.decimals}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {formData.isMintable && <Chip size="sm" color="success" variant="flat">Mintable</Chip>}
                  {formData.isBurnable && <Chip size="sm" color="warning" variant="flat">Burnable</Chip>}
                  {formData.isPausable && <Chip size="sm" color="primary" variant="flat">Pausable</Chip>}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="flat" onPress={handleClose} isDisabled={loading} radius={themeRadius}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={loading}
            radius={themeRadius}
            startContent={!loading ? <CurrencyDollarIcon className="w-4 h-4" /> : null}
          >
            {loading ? 'Creating...' : 'Create Token'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateTokenModal;