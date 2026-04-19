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
  Chip,
  Divider,
  Code
} from "@heroui/react";
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import {
  CommandLineIcon, 
  DocumentTextIcon,
  CogIcon,
  PlayIcon
} from "@heroicons/react/24/outline";

const ContractInteractionModal = ({ 
  isOpen, 
  onClose, 
  contract = null,
  onExecute,
  loading = false 
}) => {
  const [selectedFunction, setSelectedFunction] = useState('');
  const [functionParams, setFunctionParams] = useState({});
  const [gasLimit, setGasLimit] = useState('');
  const [gasPrice, setGasPrice] = useState('');
  const [value, setValue] = useState('0');
  const [errors, setErrors] = useState({});

  // Theme radius helper
  const themeRadius = useThemeRadius();

  // Mock contract functions (in a real app, this would come from the ABI)
  const contractFunctions = [
    { 
      name: 'transfer', 
      type: 'write',
      params: ['to', 'amount'],
      description: 'Transfer tokens to another address'
    },
    { 
      name: 'balanceOf', 
      type: 'read',
      params: ['owner'],
      description: 'Get token balance of an address'
    },
    { 
      name: 'approve', 
      type: 'write',
      params: ['spender', 'amount'],
      description: 'Approve another address to spend tokens'
    },
    { 
      name: 'totalSupply', 
      type: 'read',
      params: [],
      description: 'Get total token supply'
    },
    { 
      name: 'mint', 
      type: 'write',
      params: ['to', 'amount'],
      description: 'Mint new tokens (owner only)'
    }
  ];

  // Get selected function details
  const selectedFunctionData = useMemo(() => {
    return contractFunctions.find(fn => fn.name === selectedFunction);
  }, [selectedFunction]);

  // Handle parameter changes
  const handleParamChange = (paramName, value) => {
    setFunctionParams(prev => ({
      ...prev,
      [paramName]: value
    }));
    
    // Clear error when user starts typing
    if (errors[paramName]) {
      setErrors(prev => ({
        ...prev,
        [paramName]: ''
      }));
    }
  };

  // Handle function selection
  const handleFunctionChange = (functionName) => {
    setSelectedFunction(functionName);
    setFunctionParams({});
    setErrors({});
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!selectedFunction) {
      newErrors.function = 'Please select a function to call';
      setErrors(newErrors);
      return false;
    }

    // Validate required parameters
    if (selectedFunctionData?.params) {
      selectedFunctionData.params.forEach(param => {
        if (!functionParams[param]?.trim()) {
          newErrors[param] = `${param} is required`;
        }
      });
    }

    // Validate gas settings for write functions
    if (selectedFunctionData?.type === 'write') {
      if (!gasLimit || gasLimit <= 0) {
        newErrors.gasLimit = 'Gas limit is required for write functions';
      }
      if (!gasPrice || gasPrice <= 0) {
        newErrors.gasPrice = 'Gas price is required for write functions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleExecute = async () => {
    if (!validateForm()) return;

    const executionData = {
      contractAddress: contract?.address,
      functionName: selectedFunction,
      parameters: functionParams,
      gasLimit: gasLimit || null,
      gasPrice: gasPrice || null,
      value: value || '0',
      isReadOnly: selectedFunctionData?.type === 'read'
    };

    try {
      await onExecute(executionData);
      handleClose();
    } catch (error) {
      console.error('Error executing contract function:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setSelectedFunction('');
    setFunctionParams({});
    setGasLimit('');
    setGasPrice('');
    setValue('0');
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
              <CommandLineIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Contract Interaction</h2>
              <p className="text-sm text-default-500">
                {contract?.name || 'Unknown Contract'} - {contract?.address}
              </p>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* Contract Information */}
            <div className="p-4 bg-default-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DocumentTextIcon className="w-4 h-4 text-default-600" />
                <span className="font-medium text-sm">Contract Details</span>
              </div>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {contract?.name || 'Unknown'}</p>
                <p><strong>Symbol:</strong> {contract?.symbol || 'N/A'}</p>
                <p><strong>Network:</strong> {contract?.network || 'Unknown'}</p>
                <p className="font-mono text-xs"><strong>Address:</strong> {contract?.address}</p>
              </div>
            </div>

            {/* Function Selection */}
            <div>
              <Select
                label="Function to Call"
                placeholder="Select a contract function"
                selectedKeys={selectedFunction ? [selectedFunction] : []}
                onSelectionChange={(keys) => handleFunctionChange(Array.from(keys)[0] || '')}
                isInvalid={!!errors.function}
                errorMessage={errors.function}
                isRequired
                radius={themeRadius}
                classNames={{
                  trigger: "bg-default-100"
                }}
              >
                {contractFunctions.map((func) => (
                  <SelectItem key={func.name} textValue={func.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{func.name}</span>
                      <Chip
                        size="sm"
                        color={func.type === 'read' ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {func.type}
                      </Chip>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Function Description */}
            {selectedFunctionData && (
              <div className="p-3 bg-primary/10 border-l-4 border-primary rounded-r-lg">
                <p className="text-sm text-primary-600">
                  {selectedFunctionData.description}
                </p>
              </div>
            )}

            {/* Function Parameters */}
            {selectedFunctionData?.params && selectedFunctionData.params.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Function Parameters</h4>
                <div className="space-y-3">
                  {selectedFunctionData.params.map((param) => (
                    <Input
                      key={param}
                      label={param}
                      placeholder={`Enter ${param}`}
                      value={functionParams[param] || ''}
                      onValueChange={(value) => handleParamChange(param, value)}
                      isInvalid={!!errors[param]}
                      errorMessage={errors[param]}
                      radius={themeRadius}
                      classNames={{
                        inputWrapper: "bg-default-100"
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Settings (for write functions) */}
            {selectedFunctionData?.type === 'write' && (
              <>
                <Divider />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CogIcon className="w-4 h-4 text-default-600" />
                    <h4 className="text-sm font-medium">Transaction Settings</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="Gas Limit"
                      placeholder="21000"
                      value={gasLimit}
                      onValueChange={setGasLimit}
                      isInvalid={!!errors.gasLimit}
                      errorMessage={errors.gasLimit}
                      radius={themeRadius}
                      classNames={{
                        inputWrapper: "bg-default-100"
                      }}
                    />
                    <Input
                      label="Gas Price (Gwei)"
                      placeholder="20"
                      value={gasPrice}
                      onValueChange={setGasPrice}
                      isInvalid={!!errors.gasPrice}
                      errorMessage={errors.gasPrice}
                      radius={themeRadius}
                      classNames={{
                        inputWrapper: "bg-default-100"
                      }}
                    />
                    <Input
                      label="Value (ETH)"
                      placeholder="0"
                      value={value}
                      onValueChange={setValue}
                      radius={themeRadius}
                      classNames={{
                        inputWrapper: "bg-default-100"
                      }}
                      description="Amount to send with transaction"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Execution Preview */}
            {selectedFunction && (
              <>
                <Divider />
                <div>
                  <h4 className="text-sm font-medium mb-2">Execution Preview</h4>
                  <Code className="w-full p-3 text-xs">
                    {`${contract?.name || 'Contract'}.${selectedFunction}(${
                      selectedFunctionData?.params
                        ? selectedFunctionData.params.map(param => functionParams[param] || `<${param}>`).join(', ')
                        : ''
                    })`}
                  </Code>
                </div>
              </>
            )}
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
            color={selectedFunctionData?.type === 'read' ? 'success' : 'primary'}
            onPress={handleExecute}
            isLoading={loading}
            radius={themeRadius}
            startContent={!loading ? <PlayIcon className="w-4 h-4" /> : null}
            isDisabled={!selectedFunction}
          >
            {loading 
              ? 'Executing...' 
              : selectedFunctionData?.type === 'read' 
                ? 'Read Data' 
                : 'Execute Transaction'
            }
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ContractInteractionModal;