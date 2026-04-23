import React, { useMemo, useCallback, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Button,
  Chip,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Pagination,
  Avatar,
  Progress
} from "@heroui/react";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import {
  EyeIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisVerticalIcon,
  StarIcon,
  PlusIcon,
  MinusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from "@heroicons/react/24/outline";

const TokensTable = ({
  tokens = [],
  loading = false,
  onView = () => {},
  onTrade = () => {},
  onAnalyze = () => {},
  onAddToWatchlist = () => {},
  pagination = { currentPage: 1, perPage: 10, total: 0 },
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
  watchlist = []
}) => {
  const [favorites, setFavorites] = useState(new Set(watchlist || []));

  // Theme radius helper
  const themeRadius = useThemeRadius();
// Format price
  const formatPrice = useCallback((price) => {
    if (!price || isNaN(price)) return '$0.00';
    const num = parseFloat(price);
    
    if (num >= 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      }).format(num);
    }
  }, []);

  // Format market cap
  const formatMarketCap = useCallback((value) => {
    if (!value || isNaN(value)) return '$0';
    const num = parseFloat(value);
    
    if (num >= 1000000000000) return `$${(num / 1000000000000).toFixed(2)}T`;
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }, []);

  // Format percentage change
  const formatPercentage = useCallback((value) => {
    if (!value || isNaN(value)) return '0.00%';
    const num = parseFloat(value);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback(async (token) => {
    const newFavorites = new Set(favorites);
    
    if (favorites.has(token.id)) {
      newFavorites.delete(token.id);
    } else {
      newFavorites.add(token.id);
    }
    
    setFavorites(newFavorites);
    
    try {
      await onAddToWatchlist(token.id, !favorites.has(token.id));
    } catch (error) {
      // Revert on error
      setFavorites(favorites);
      console.error('Error updating watchlist:', error);
    }
  }, [favorites, onAddToWatchlist]);

  const columns = [
    { name: "Rank", uid: "rank" },
    { name: "Token", uid: "token" },
    { name: "Price", uid: "price" },
    { name: "24h Change", uid: "change24h" },
    { name: "7d Change", uid: "change7d" },
    { name: "Market Cap", uid: "marketCap" },
    { name: "Volume (24h)", uid: "volume24h" },
    { name: "Supply", uid: "supply" },
    { name: "Actions", uid: "actions" },
  ];

  const renderCell = useCallback((token, columnKey) => {
    const cellValue = token[columnKey];

    switch (columnKey) {
      case "rank":
        return (
          <div className="flex items-center gap-2">
            <span className="text-small font-bold text-default-600">#{token.rank || 0}</span>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => toggleFavorite(token)}
              className={favorites.has(token.id) ? 'text-warning' : 'text-default-400'}
            >
              <StarIcon className={`w-4 h-4 ${favorites.has(token.id) ? 'fill-current' : ''}`} />
            </Button>
          </div>
        );
      case "token":
        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={token.logo}
              name={token.symbol}
              size="sm"
              className="shrink-0"
              fallback={
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {token.symbol?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              }
            />
            <div>
              <p className="text-bold text-small">{token.name}</p>
              <p className="text-tiny text-default-400 uppercase font-mono">{token.symbol}</p>
            </div>
          </div>
        );
      case "price":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{formatPrice(token.price)}</p>
            {token.priceChange1h && (
              <div className="flex items-center gap-1">
                {parseFloat(token.priceChange1h) >= 0 ? (
                  <ArrowTrendingUpIcon className="w-3 h-3 text-success" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3 text-danger" />
                )}
                <span className={`text-tiny ${parseFloat(token.priceChange1h) >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatPercentage(Math.abs(token.priceChange1h))} 1h
                </span>
              </div>
            )}
          </div>
        );
      case "change24h":
        const change24h = parseFloat(token.priceChange24h || 0);
        return (
          <Chip
            className="capitalize"
            color={change24h >= 0 ? "success" : "danger"}
            size="sm"
            variant="flat"
            startContent={
              change24h >= 0 ? 
                <ArrowTrendingUpIcon className="w-3 h-3" /> : 
                <ArrowTrendingDownIcon className="w-3 h-3" />
            }
          >
            {formatPercentage(change24h)}
          </Chip>
        );
      case "change7d":
        const change7d = parseFloat(token.priceChange7d || 0);
        return (
          <span className={`text-small font-medium ${change7d >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatPercentage(change7d)}
          </span>
        );
      case "marketCap":
        return (
          <div className="flex flex-col">
            <p className="text-small font-medium">{formatMarketCap(token.marketCap)}</p>
            {token.marketCapRank && (
              <p className="text-tiny text-default-400">Rank #{token.marketCapRank}</p>
            )}
          </div>
        );
      case "volume24h":
        return (
          <div className="flex flex-col">
            <p className="text-small">{formatMarketCap(token.volume24h)}</p>
            {token.volumeChangePercentage && (
              <span className={`text-tiny ${parseFloat(token.volumeChangePercentage) >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatPercentage(token.volumeChangePercentage)}
              </span>
            )}
          </div>
        );
      case "supply":
        const supplyPercentage = token.maxSupply ? 
          (parseFloat(token.circulatingSupply) / parseFloat(token.maxSupply)) * 100 : null;
        
        return (
          <div className="flex flex-col gap-1">
            <div className="text-small">
              {token.circulatingSupply ? 
                `${parseFloat(token.circulatingSupply).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 
                'Unknown'
              }
            </div>
            {supplyPercentage && (
              <div className="flex items-center gap-2">
                <Progress
                  size="sm"
                  radius="sm"
                  value={supplyPercentage}
                  className="max-w-[60px]"
                  classNames={{
                    indicator: "bg-primary"
                  }}
                />
                <span className="text-tiny text-default-400">
                  {supplyPercentage.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  startContent={<EyeIcon className="w-4 h-4" />}
                  onPress={() => onView(token)}
                >
                  View Details
                </DropdownItem>
                <DropdownItem
                  startContent={<ArrowsRightLeftIcon className="w-4 h-4" />}
                  onPress={() => onTrade(token)}
                >
                  Trade Token
                </DropdownItem>
                <DropdownItem
                  startContent={<ChartBarIcon className="w-4 h-4" />}
                  onPress={() => onAnalyze(token)}
                >
                  Analyze
                </DropdownItem>
                <DropdownItem
                  startContent={favorites.has(token.id) ? <MinusIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                  onPress={() => toggleFavorite(token)}
                >
                  {favorites.has(token.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </DropdownItem>
                {token.explorerUrl && (
                  <DropdownItem
                    startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                    onPress={() => window.open(token.explorerUrl, '_blank')}
                  >
                    View on Explorer
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, [formatPrice, formatMarketCap, formatPercentage, favorites, toggleFavorite, onView, onTrade, onAnalyze]);

  const topContent = useMemo(() => {
    const totalMarketCap = tokens.reduce((sum, token) => sum + parseFloat(token.marketCap || 0), 0);
    const totalVolume = tokens.reduce((sum, token) => sum + parseFloat(token.volume24h || 0), 0);
    
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {pagination.total} tokens
          </span>
          <div className="flex gap-4 text-small">
            <div className="text-center">
              <div className="text-default-500">Market Cap</div>
              <div className="font-semibold">{formatMarketCap(totalMarketCap)}</div>
            </div>
            <div className="text-center">
              <div className="text-default-500">24h Volume</div>
              <div className="font-semibold">{formatMarketCap(totalVolume)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [pagination.total, tokens, formatMarketCap]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {tokens.length > 0 ? `${((pagination.currentPage - 1) * pagination.perPage) + 1}-${Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of ${pagination.total}` : ''}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={pagination.currentPage}
          total={Math.ceil(pagination.total / pagination.perPage)}
          onChange={onPageChange}
          radius={themeRadius}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          {/* Rows per page selector could go here */}
        </div>
      </div>
    );
  }, [pagination, tokens.length, onPageChange, getThemeRadius]);

  return (
    <Table
      aria-label="Tokens table"
      isHeaderSticky
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "shadow-none border border-divider rounded-lg",
        th: "bg-default-100 text-default-600 font-semibold",
        td: "py-3"
      }}
      topContent={topContent}
      topContentPlacement="outside"
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" || column.uid === "rank" ? "center" : "start"}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody 
        items={tokens || []}
        loadingContent={<Spinner />}
        loadingState={loading ? "loading" : "idle"}
        emptyContent="No tokens found"
      >
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default TokensTable;