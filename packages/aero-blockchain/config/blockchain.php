<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Blockchain Platform Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for the blockchain and distributed ledger platform
    |
    */

    'enabled' => env('BLOCKCHAIN_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Default Blockchain Network
    |--------------------------------------------------------------------------
    |
    | The default blockchain network to use for transactions and interactions
    |
    */
    'default_network' => env('BLOCKCHAIN_DEFAULT_NETWORK', 'ethereum'),

    /*
    |--------------------------------------------------------------------------
    | Network Configurations
    |--------------------------------------------------------------------------
    |
    | Configuration for different blockchain networks
    |
    */
    'networks' => [
        'ethereum' => [
            'name' => 'Ethereum',
            'type' => 'ethereum',
            'chain_id' => env('ETH_CHAIN_ID', 1),
            'rpc_endpoint' => env('ETH_RPC_ENDPOINT', 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID'),
            'explorer_url' => 'https://etherscan.io',
            'native_token' => 'ETH',
            'consensus' => 'proof_of_stake',
            'block_time' => 12,
            'confirmation_blocks' => 12,
            'gas_limit' => 8000000,
            'gas_price' => 20000000000, // 20 Gwei
        ],
        'polygon' => [
            'name' => 'Polygon',
            'type' => 'polygon',
            'chain_id' => env('POLYGON_CHAIN_ID', 137),
            'rpc_endpoint' => env('POLYGON_RPC_ENDPOINT', 'https://polygon-rpc.com'),
            'explorer_url' => 'https://polygonscan.com',
            'native_token' => 'MATIC',
            'consensus' => 'proof_of_stake',
            'block_time' => 2,
            'confirmation_blocks' => 128,
        ],
        'bsc' => [
            'name' => 'Binance Smart Chain',
            'type' => 'bsc',
            'chain_id' => env('BSC_CHAIN_ID', 56),
            'rpc_endpoint' => env('BSC_RPC_ENDPOINT', 'https://bsc-dataseed.binance.org'),
            'explorer_url' => 'https://bscscan.com',
            'native_token' => 'BNB',
            'consensus' => 'proof_of_authority',
            'block_time' => 3,
            'confirmation_blocks' => 15,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Web3 Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Web3 provider and blockchain interactions
    |
    */
    'web3' => [
        'provider' => env('WEB3_PROVIDER', 'http'),
        'timeout' => env('WEB3_TIMEOUT', 30),
        'max_retries' => env('WEB3_MAX_RETRIES', 3),
        'gas_multiplier' => env('WEB3_GAS_MULTIPLIER', 1.2),
    ],

    /*
    |--------------------------------------------------------------------------
    | Wallet Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for wallet management and security
    |
    */
    'wallets' => [
        'encryption' => [
            'algorithm' => env('WALLET_ENCRYPTION_ALGO', 'AES-256-CBC'),
            'key' => env('WALLET_ENCRYPTION_KEY'),
        ],
        'derivation' => [
            'path' => "m/44'/60'/0'/0", // Ethereum derivation path
            'mnemonic_strength' => 128, // 12 words
        ],
        'security' => [
            'require_2fa' => env('WALLET_REQUIRE_2FA', false),
            'session_timeout' => env('WALLET_SESSION_TIMEOUT', 3600), // 1 hour
            'max_failed_attempts' => env('WALLET_MAX_FAILED_ATTEMPTS', 3),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Smart Contract Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for smart contract deployment and interaction
    |
    */
    'contracts' => [
        'deployment' => [
            'gas_limit' => env('CONTRACT_GAS_LIMIT', 3000000),
            'gas_price' => env('CONTRACT_GAS_PRICE', 20000000000), // 20 Gwei
            'optimization' => env('CONTRACT_OPTIMIZATION', true),
            'compiler_version' => env('CONTRACT_COMPILER_VERSION', '0.8.19'),
        ],
        'verification' => [
            'auto_verify' => env('CONTRACT_AUTO_VERIFY', false),
            'etherscan_api_key' => env('ETHERSCAN_API_KEY'),
            'polygonscan_api_key' => env('POLYGONSCAN_API_KEY'),
            'bscscan_api_key' => env('BSCSCAN_API_KEY'),
        ],
        'interaction' => [
            'read_timeout' => env('CONTRACT_READ_TIMEOUT', 10),
            'write_timeout' => env('CONTRACT_WRITE_TIMEOUT', 60),
            'max_gas_price' => env('CONTRACT_MAX_GAS_PRICE', 100000000000), // 100 Gwei
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Token Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for token management and tracking
    |
    */
    'tokens' => [
        'price_feeds' => [
            'enabled' => env('TOKEN_PRICE_FEEDS_ENABLED', true),
            'provider' => env('TOKEN_PRICE_PROVIDER', 'coingecko'),
            'update_interval' => env('TOKEN_PRICE_UPDATE_INTERVAL', 300), // 5 minutes
            'api_key' => env('TOKEN_PRICE_API_KEY'),
        ],
        'balance_sync' => [
            'enabled' => env('TOKEN_BALANCE_SYNC_ENABLED', true),
            'interval' => env('TOKEN_BALANCE_SYNC_INTERVAL', 600), // 10 minutes
            'batch_size' => env('TOKEN_BALANCE_BATCH_SIZE', 100),
        ],
        'default_tokens' => [
            // Popular tokens to track by default
            'ethereum' => [
                '0xA0b86a33E6441C02a31e6BA680BC9BD2C1a43e8f', // USDC
                '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
                '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Consensus Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for consensus mechanisms and node management
    |
    */
    'consensus' => [
        'node_monitoring' => [
            'enabled' => env('CONSENSUS_MONITORING_ENABLED', true),
            'heartbeat_interval' => env('CONSENSUS_HEARTBEAT_INTERVAL', 60), // seconds
            'offline_threshold' => env('CONSENSUS_OFFLINE_THRESHOLD', 300), // seconds
        ],
        'staking' => [
            'enabled' => env('STAKING_ENABLED', false),
            'minimum_stake' => env('MINIMUM_STAKE_AMOUNT', 32), // 32 ETH equivalent
            'slashing_enabled' => env('SLASHING_ENABLED', true),
            'reward_distribution' => env('REWARD_DISTRIBUTION', 'proportional'),
        ],
        'governance' => [
            'voting_period' => env('GOVERNANCE_VOTING_PERIOD', 604800), // 1 week
            'proposal_threshold' => env('GOVERNANCE_PROPOSAL_THRESHOLD', 1000000), // 1M tokens
            'quorum_percentage' => env('GOVERNANCE_QUORUM', 10), // 10%
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Analytics Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for blockchain analytics and metrics collection
    |
    */
    'analytics' => [
        'enabled' => env('BLOCKCHAIN_ANALYTICS_ENABLED', true),
        'collection_interval' => env('ANALYTICS_COLLECTION_INTERVAL', 3600), // 1 hour
        'retention_days' => env('ANALYTICS_RETENTION_DAYS', 365),
        'metrics' => [
            'network' => ['total_addresses', 'active_addresses', 'transaction_count', 'hash_rate'],
            'transaction' => ['average_fee', 'median_fee', 'total_volume', 'success_rate'],
            'block' => ['average_block_time', 'gas_utilization', 'blocks_per_hour'],
            'token' => ['total_supply', 'holder_count', 'transfer_count', 'market_cap'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    |
    | Blockchain security and validation settings
    |
    */
    'security' => [
        'transaction_validation' => [
            'signature_verification' => env('VERIFY_SIGNATURES', true),
            'nonce_validation' => env('VALIDATE_NONCES', true),
            'balance_checks' => env('VALIDATE_BALANCES', true),
        ],
        'rate_limiting' => [
            'enabled' => env('BLOCKCHAIN_RATE_LIMIT_ENABLED', true),
            'requests_per_minute' => env('BLOCKCHAIN_REQUESTS_PER_MINUTE', 100),
            'burst_limit' => env('BLOCKCHAIN_BURST_LIMIT', 200),
        ],
        'audit_logging' => [
            'enabled' => env('BLOCKCHAIN_AUDIT_LOGGING', true),
            'log_all_transactions' => env('LOG_ALL_TRANSACTIONS', true),
            'log_failed_transactions' => env('LOG_FAILED_TRANSACTIONS', true),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Integration Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for third-party integrations
    |
    */
    'integrations' => [
        'infura' => [
            'project_id' => env('INFURA_PROJECT_ID'),
            'project_secret' => env('INFURA_PROJECT_SECRET'),
        ],
        'alchemy' => [
            'api_key' => env('ALCHEMY_API_KEY'),
        ],
        'moralis' => [
            'api_key' => env('MORALIS_API_KEY'),
        ],
        'coingecko' => [
            'api_key' => env('COINGECKO_API_KEY'),
        ],
        'etherscan' => [
            'api_key' => env('ETHERSCAN_API_KEY'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Configuration
    |--------------------------------------------------------------------------
    |
    | Performance optimization settings
    |
    */
    'performance' => [
        'caching' => [
            'enabled' => env('BLOCKCHAIN_CACHING_ENABLED', true),
            'ttl' => env('BLOCKCHAIN_CACHE_TTL', 300), // 5 minutes
            'driver' => env('BLOCKCHAIN_CACHE_DRIVER', 'redis'),
        ],
        'queuing' => [
            'enabled' => env('BLOCKCHAIN_QUEUING_ENABLED', true),
            'queue' => env('BLOCKCHAIN_QUEUE_NAME', 'blockchain'),
            'connection' => env('BLOCKCHAIN_QUEUE_CONNECTION', 'redis'),
        ],
        'batch_processing' => [
            'enabled' => env('BLOCKCHAIN_BATCH_PROCESSING', true),
            'batch_size' => env('BLOCKCHAIN_BATCH_SIZE', 100),
            'processing_interval' => env('BLOCKCHAIN_PROCESSING_INTERVAL', 60), // seconds
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Development Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for development and testing
    |
    */
    'development' => [
        'testnet_enabled' => env('BLOCKCHAIN_TESTNET_ENABLED', true),
        'mock_transactions' => env('MOCK_BLOCKCHAIN_TRANSACTIONS', false),
        'debug_mode' => env('BLOCKCHAIN_DEBUG_MODE', false),
        'local_node' => [
            'enabled' => env('LOCAL_BLOCKCHAIN_NODE', false),
            'port' => env('LOCAL_NODE_PORT', 8545),
            'accounts' => env('LOCAL_NODE_ACCOUNTS', 10),
        ],
    ],
];
