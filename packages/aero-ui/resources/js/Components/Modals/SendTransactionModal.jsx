import React, { useState, useMemo, useEffect } from 'react';
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
  Card,
  CardBody
} from "@heroui/react";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import {
  PaperAirplaneIcon, 
  WalletIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

const SendTransactionModal = ({ 
  isOpen, 
  onClose, 
  wallets = [],
  onSend,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    fromWallet: '',
    toAddress: '',
    amount: '',
    currency: '',
    gasLimit: '21000',
    gasPrice: '20',
    memo: ''
  });
  
  const [errors, setErrors] = useState({});
  const [estimatedFee, setEstimatedFee] = useState(null);

  // Theme radius helper
  const themeRadius = useThemeRadius();

  // Get selected wallet details
  const selectedWallet = useMemo(() => {
    return wallets.find(wallet => wallet.id === formData.fromWallet);
  }, [wallets, formData.fromWallet]);

  // Available currencies based on selected wallet
  const availableCurrencies = useMemo(() => {
    if (!selectedWallet) return [];
    
    // Mock currencies - in a real app, this would come from the wallet's supported tokens
    const currencies = [
      { key: 'ETH', label: 'Ethereum (ETH)', balance: selectedWallet.ethBalance || '0.00' },
      { key: 'BTC', label: 'Bitcoin (BTC)', balance: selectedWallet.btcBalance || '0.00' },
      { key: 'USDT', label: 'Tether USD (USDT)', balance: selectedWallet.usdtBalance || '0.00' },
      { key: 'USDC', label: 'USD Coin (USDC)', balance: selectedWallet.usdcBalance || '0.00' }
    ];
    
    return currencies.filter(currency => parseFloat(currency.balance) > 0);
  }, [selectedWallet]);

  // Calculate estimated fee
  useEffect(() => {
    if (formData.gasLimit && formData.gasPrice) {
      const gasFee = (parseFloat(formData.gasLimit) * parseFloat(formData.gasPrice)) / 1000000000; // Convert from Gwei
      setEstimatedFee(gasFee.toFixed(6));
    } else {
      setEstimatedFee(null);
    }
  }, [formData.gasLimit, formData.gasPrice]);

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

    // Auto-set currency when wallet is selected
    if (field === 'fromWallet') {
      const wallet = wallets.find(w => w.id === value);
      if (wallet && wallet.primaryCurrency) {
        setFormData(prev => ({
          ...prev,
          currency: wallet.primaryCurrency
        }));
      }
    }
  };

  // Validate wallet address
  const isValidAddress = (address) => {
    // Basic validation - in a real app, this would be blockchain-specific
    if (!address) return false;
    if (address.length < 10) return false;
    // Add more specific validation based on blockchain
    return true;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fromWallet) {
      newErrors.fromWallet = 'Please select a wallet';
    }

    if (!formData.toAddress.trim()) {
      newErrors.toAddress = 'Recipient address is required';
    } else if (!isValidAddress(formData.toAddress)) {
      newErrors.toAddress = 'Please enter a valid wallet address';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (selectedWallet && formData.currency) {
      const selectedCurrency = availableCurrencies.find(c => c.key === formData.currency);
      if (selectedCurrency && parseFloat(formData.amount) > parseFloat(selectedCurrency.balance)) {
        newErrors.amount = 'Insufficient balance';
      }
    }

    if (!formData.currency) {
      newErrors.currency = 'Please select a currency';
    }

    if (!formData.gasLimit || parseFloat(formData.gasLimit) <= 0) {
      newErrors.gasLimit = 'Gas limit must be greater than 0';
    }

    if (!formData.gasPrice || parseFloat(formData.gasPrice) <= 0) {
      newErrors.gasPrice = 'Gas price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSend = async () => {
    if (!validateForm()) return;

    const transactionData = {
      ...formData,
      estimatedFee,
      walletAddress: selectedWallet?.address,
      walletName: selectedWallet?.name
    };

    try {
      await onSend(transactionData);
      handleClose();
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      fromWallet: '',
      toAddress: '',
      amount: '',
      currency: '',
      gasLimit: '21000',
      gasPrice: '20',
      memo: ''
    });
    setErrors({});
    setEstimatedFee(null);
    onClose();
  };

  // Get max amount for selected currency
  const getMaxAmount = () => {
    if (!formData.currency) return null;
    const selectedCurrency = availableCurrencies.find(c => c.key === formData.currency);
    return selectedCurrency?.balance || '0.00';
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
              <PaperAirplaneIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Send Transaction</h2>
              <p className="text-sm text-default-500">Transfer cryptocurrency to another wallet</p>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* From Wallet */}
            <div>
              <Select
                label="From Wallet"
                placeholder="Select your wallet"
                selectedKeys={formData.fromWallet ? [formData.fromWallet] : []}
                onSelectionChange={(keys) => handleInputChange('fromWallet', Array.from(keys)[0] || '')}
                isInvalid={!!errors.fromWallet}
                errorMessage={errors.fromWallet}
                isRequired
                radius={themeRadius}
                classNames={{
                  trigger: "bg-default-100"
                }}
                startContent={<WalletIcon className="w-4 h-4 text-default-400" />}
              >
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} textValue={wallet.name}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <span className="font-medium">{wallet.name}</span>
                        <p className="text-tiny text-default-400 font-mono">
                          {wallet.address?.substring(0, 8)}...{wallet.address?.slice(-6)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-small font-medium">{wallet.balance || '0.00'}</p>
                        <p className="text-tiny text-default-400">{wallet.currency || 'ETH'}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* To Address */}
            <Input
              label="Recipient Address"
              placeholder="Enter recipient wallet address"
              value={formData.toAddress}
              onValueChange={(value) => handleInputChange('toAddress', value)}
              isInvalid={!!errors.toAddress}
              errorMessage={errors.toAddress}
              isRequired
              radius={themeRadius}
              classNames={{
                inputWrapper: "bg-default-100"
              }}
              description="Make sure the address is correct. Transactions cannot be reversed."
            />

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Amount"
                placeholder="0.00"
                value={formData.amount}
                onValueChange={(value) => handleInputChange('amount', value)}
                isInvalid={!!errors.amount}
                errorMessage={errors.amount}
                isRequired
                radius={themeRadius}
                classNames={{
                  inputWrapper: "bg-default-100"
                }}
                startContent={<CurrencyDollarIcon className="w-4 h-4 text-default-400" />}
                endContent={
                  getMaxAmount() && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      className="text-tiny"
                      onPress={() => handleInputChange('amount', getMaxAmount())}
                    >
                      MAX
                    </Button>
                  )
                }
              />

              <Select
                label="Currency"
                placeholder="Select currency"
                selectedKeys={formData.currency ? [formData.currency] : []}
                onSelectionChange={(keys) => handleInputChange('currency', Array.from(keys)[0] || '')}
                isInvalid={!!errors.currency}
                errorMessage={errors.currency}
                isRequired
                radius={themeRadius}
                classNames={{
                  trigger: "bg-default-100"
                }}
                isDisabled={!selectedWallet}
              >
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency.key} textValue={currency.label}>
                    <div className="flex items-center justify-between w-full">
                      <span>{currency.label}</span>
                      <span className="text-tiny text-default-400">
                        Balance: {currency.balance}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Divider />

            {/* Gas Settings */}
            <div>
              <h4 className="text-sm font-medium mb-3">Transaction Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Gas Limit"
                  placeholder="21000"
                  value={formData.gasLimit}
                  onValueChange={(value) => handleInputChange('gasLimit', value)}
                  isInvalid={!!errors.gasLimit}
                  errorMessage={errors.gasLimit}
                  radius={themeRadius}
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                  description="Higher gas limit = faster confirmation"
                />
                <Input
                  label="Gas Price (Gwei)"
                  placeholder="20"
                  value={formData.gasPrice}
                  onValueChange={(value) => handleInputChange('gasPrice', value)}
                  isInvalid={!!errors.gasPrice}
                  errorMessage={errors.gasPrice}
                  radius={themeRadius}
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                  description="Higher gas price = faster confirmation"
                />
              </div>
            </div>

            {/* Memo (Optional) */}
            <Textarea
              label="Memo (Optional)"
              placeholder="Add a note for this transaction"
              value={formData.memo}
              onValueChange={(value) => handleInputChange('memo', value)}
              radius={themeRadius}
              classNames={{
                inputWrapper: "bg-default-100"
              }}
              minRows={2}
              maxRows={3}
            />

            {/* Transaction Summary */}
            {formData.amount && formData.currency && estimatedFee && (
              <>
                <Divider />
                <Card>
                  <CardBody className="space-y-3">
                    <h4 className="text-sm font-medium">Transaction Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-default-500">Amount:</span>
                        <span className="font-medium">{formData.amount} {formData.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-500">Network Fee:</span>
                        <span className="font-medium">{estimatedFee} ETH</span>
                      </div>
                      <Divider />
                      <div className="flex justify-between font-medium">
                        <span>Total Cost:</span>
                        <span>
                          {formData.amount} {formData.currency} + {estimatedFee} ETH
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </>
            )}

            {/* Warning */}
            <div className="p-4 bg-warning-50 border-l-4 border-warning rounded-r-lg">
              <div className="flex gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-warning-800 font-medium">Important</p>
                  <p className="text-sm text-warning-700 mt-1">
                    Double-check the recipient address and amount. Blockchain transactions cannot be reversed once confirmed.
                  </p>
                </div>
              </div>
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
            onPress={handleSend}
            isLoading={loading}
            radius={themeRadius}
            startContent={!loading ? <PaperAirplaneIcon className="w-4 h-4" /> : null}
            isDisabled={!formData.fromWallet || !formData.toAddress || !formData.amount || !formData.currency}
          >
            {loading ? 'Sending...' : 'Send Transaction'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SendTransactionModal;