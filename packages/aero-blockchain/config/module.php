<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Blockchain Module
    |--------------------------------------------------------------------------
    |
    | Manages blockchain networks, wallets, transactions, smart contracts,
    | tokens, consensus nodes, and analytics.
    |
    */

    'code' => 'blockchain',
    'scope' => 'tenant',
    'name' => 'Blockchain Management',
    'description' => 'Enterprise blockchain operations — networks, wallets, smart contracts, tokens, and analytics.',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'CubeTransparentIcon',
    'priority' => 25,
    'enabled' => env('BLOCKCHAIN_MODULE_ENABLED', true),
    'minimum_plan' => 'enterprise',
    'dependencies' => ['core'],
    'route_prefix' => 'blockchain',

    'submodules' => [

        // ==================== BLOCKCHAIN DASHBOARD ====================
        [
            'code' => 'blockchain-dashboard',
            'name' => 'Blockchain Dashboard',
            'description' => 'Overview of blockchain networks, wallets, and transaction metrics.',
            'icon' => 'ChartPieIcon',
            'route' => 'blockchain.dashboard',
            'priority' => 1,
            'is_active' => true,
            'components' => [],
        ],

        // ==================== NETWORKS ====================
        [
            'code' => 'networks',
            'name' => 'Blockchain Networks',
            'description' => 'Manage blockchain network connections and configurations.',
            'icon' => 'GlobeAltIcon',
            'route' => 'blockchain.networks.index',
            'priority' => 2,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'network-list',
                    'name' => 'Network List',
                    'description' => 'View and manage blockchain networks.',
                    'route_name' => 'blockchain.networks.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== WALLETS ====================
        [
            'code' => 'wallets',
            'name' => 'Wallets',
            'description' => 'Manage blockchain wallets, balances, and transfers.',
            'icon' => 'WalletIcon',
            'route' => 'blockchain.wallets.index',
            'priority' => 3,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'wallet-list',
                    'name' => 'Wallet List',
                    'description' => 'View and manage wallets.',
                    'route_name' => 'blockchain.wallets.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'transfer', 'name' => 'Transfer', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== TRANSACTIONS ====================
        [
            'code' => 'transactions',
            'name' => 'Transactions',
            'description' => 'View and manage blockchain transactions.',
            'icon' => 'ArrowsRightLeftIcon',
            'route' => 'blockchain.transactions.index',
            'priority' => 4,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'transaction-list',
                    'name' => 'Transaction List',
                    'description' => 'View and create blockchain transactions.',
                    'route_name' => 'blockchain.transactions.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== SMART CONTRACTS ====================
        [
            'code' => 'smart-contracts',
            'name' => 'Smart Contracts',
            'description' => 'Deploy, manage, and interact with smart contracts.',
            'icon' => 'CodeBracketIcon',
            'route' => 'blockchain.contracts.index',
            'priority' => 5,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'contract-list',
                    'name' => 'Contract List',
                    'description' => 'View and manage smart contracts.',
                    'route_name' => 'blockchain.contracts.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'deploy', 'name' => 'Deploy', 'is_active' => true],
                        ['code' => 'verify', 'name' => 'Verify', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== TOKENS ====================
        [
            'code' => 'tokens',
            'name' => 'Tokens',
            'description' => 'Manage blockchain tokens and track holders/transfers.',
            'icon' => 'CircleStackIcon',
            'route' => 'blockchain.tokens.index',
            'priority' => 6,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'token-list',
                    'name' => 'Token List',
                    'description' => 'View and manage tokens.',
                    'route_name' => 'blockchain.tokens.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== CONSENSUS ====================
        [
            'code' => 'consensus',
            'name' => 'Consensus Nodes',
            'description' => 'Manage validator/consensus nodes and staking operations.',
            'icon' => 'ServerStackIcon',
            'route' => 'blockchain.consensus.index',
            'priority' => 7,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'node-list',
                    'name' => 'Node List',
                    'description' => 'View and manage consensus nodes.',
                    'route_name' => 'blockchain.consensus.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'stake', 'name' => 'Stake', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== ANALYTICS ====================
        [
            'code' => 'analytics',
            'name' => 'Blockchain Analytics',
            'description' => 'Network analytics, transaction metrics, DeFi, and NFT insights.',
            'icon' => 'ChartBarIcon',
            'route' => 'blockchain.analytics.index',
            'priority' => 8,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'analytics-dashboard',
                    'name' => 'Analytics Dashboard',
                    'description' => 'Blockchain analytics and reporting.',
                    'route_name' => 'blockchain.analytics.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== BLOCK EXPLORER ====================
        [
            'code' => 'explorer',
            'name' => 'Block Explorer',
            'description' => 'Browse blocks, transactions, addresses, and contracts.',
            'icon' => 'MagnifyingGlassIcon',
            'route' => 'blockchain.explorer.index',
            'priority' => 9,
            'is_active' => true,
            'components' => [],
        ],

        // ==================== SETTINGS ====================
        [
            'code' => 'settings',
            'name' => 'Blockchain Settings',
            'description' => 'Configure blockchain module settings.',
            'icon' => 'CogIcon',
            'route' => 'blockchain.settings.index',
            'priority' => 99,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'settings-config',
                    'name' => 'Settings',
                    'description' => 'Module configuration.',
                    'route_name' => 'blockchain.settings.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                    ],
                ],
            ],
        ],
    ],
];
