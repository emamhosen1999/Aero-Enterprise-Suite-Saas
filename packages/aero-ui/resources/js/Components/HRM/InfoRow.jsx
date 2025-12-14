import React from 'react';
import { Chip } from "@heroui/react";

const InfoRow = ({ 
  label, 
  value, 
  icon, 
  type = "text",
  className = "",
  valueClassName = "",
  labelClassName = "",
  showDivider = true 
}) => {
  const formatValue = (val, valueType) => {
    if (!val || val === 'N/A') return 'N/A';
    
    switch (valueType) {
      case 'date':
        return new Date(val).toLocaleDateString();
      case 'email':
        return val;
      case 'phone':
        return val;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(val);
      default:
        return val;
    }
  };

  const getValueColor = () => {
    if (!value || value === 'N/A') return 'text-default-400';
    return 'text-foreground';
  };

  return (
    <div className={`flex items-center justify-between py-3 ${showDivider ? 'border-b border-white/10 last:border-b-0' : ''} ${className}`}>
      <div className={`flex items-center gap-2 text-sm text-default-600 ${labelClassName}`}>
        {icon && React.cloneElement(icon, { className: "w-4 h-4" })}
        <span>{label}</span>
      </div>
      
      <div className={`text-sm font-medium ${getValueColor()} text-right ${valueClassName}`}>
        {type === 'chip' && value && value !== 'N/A' ? (
          <Chip size="sm" variant="flat" color="primary">
            {formatValue(value, type)}
          </Chip>
        ) : (
          <span>{formatValue(value, type)}</span>
        )}
      </div>
    </div>
  );
};

export default InfoRow;
