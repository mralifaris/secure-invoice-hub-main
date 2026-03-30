/**
 * Blockchain Service (SIMULATED)
 * 
 * This service simulates blockchain functionality for invoice verification.
 * In a real implementation, this would interact with Ethereum/Solidity smart contracts.
 * 
 * Features:
 * - Block creation
 * - Hash generation (SHA-256 simulation)
 * - Hash verification
 * - Transaction history
 */

export interface Block {
  index: number;
  timestamp: string;
  data: unknown;
  previousHash: string;
  hash: string;
  nonce: number;
}

export interface VerificationResult {
  isValid: boolean;
  block: Block | null;
  message: string;
  timestamp: string;
}

const BLOCKCHAIN_KEY = 'blockchain_ledger';
const HASH_REGISTRY_KEY = 'blockchain_hash_registry';

/**
 * Simulates SHA-256 hash generation
 * In a real implementation, this would use crypto.subtle.digest or similar
 * @param data - Data to hash
 * @returns Simulated hash string
 */
export const generateBlockchainHash = (data: unknown): string => {
  const str = JSON.stringify(data) + Date.now() + Math.random();
  
  // Simulate a SHA-256 like hash (64 hex characters)
  let hash = '0x';
  const chars = '0123456789ABCDEF';
  
  // Use a deterministic approach based on input
  let seed = 0;
  for (let i = 0; i < str.length; i++) {
    seed = ((seed << 5) - seed) + str.charCodeAt(i);
    seed = seed & seed;
  }
  
  for (let i = 0; i < 64; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    hash += chars[seed % 16];
  }
  
  return hash;
};

/**
 * Initialize the blockchain with genesis block
 */
const initializeBlockchain = (): void => {
  const existing = localStorage.getItem(BLOCKCHAIN_KEY);
  if (!existing) {
    const genesisBlock: Block = {
      index: 0,
      timestamp: '2024-01-01T00:00:00Z',
      data: { type: 'genesis', message: 'InvoiceChain Genesis Block' },
      previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      hash: '0xGENESIS1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E',
      nonce: 0,
    };
    localStorage.setItem(BLOCKCHAIN_KEY, JSON.stringify([genesisBlock]));
    localStorage.setItem(HASH_REGISTRY_KEY, JSON.stringify({}));
  }
};

/**
 * Get the current blockchain
 * @returns Array of blocks
 */
const getBlockchain = (): Block[] => {
  initializeBlockchain();
  const chain = localStorage.getItem(BLOCKCHAIN_KEY);
  return chain ? JSON.parse(chain) : [];
};

/**
 * Get hash registry
 * @returns Object mapping hashes to invoice IDs
 */
const getHashRegistry = (): Record<string, string> => {
  const registry = localStorage.getItem(HASH_REGISTRY_KEY);
  return registry ? JSON.parse(registry) : {};
};

/**
 * Save blockchain to storage
 */
const saveBlockchain = (chain: Block[]): void => {
  localStorage.setItem(BLOCKCHAIN_KEY, JSON.stringify(chain));
};

/**
 * Save hash registry
 */
const saveHashRegistry = (registry: Record<string, string>): void => {
  localStorage.setItem(HASH_REGISTRY_KEY, JSON.stringify(registry));
};

/**
 * Create a new block for an invoice
 * @param invoiceId - Invoice ID
 * @param invoiceData - Invoice data to store
 * @returns Created block
 */
export const createBlock = async (invoiceId: string, invoiceData: unknown): Promise<Block> => {
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate mining delay

  const chain = getBlockchain();
  const previousBlock = chain[chain.length - 1];

  const blockData = {
    type: 'invoice',
    invoiceId,
    data: invoiceData,
  };

  const hash = generateBlockchainHash({
    index: chain.length,
    previousHash: previousBlock.hash,
    data: blockData,
    timestamp: new Date().toISOString(),
  });

  const newBlock: Block = {
    index: chain.length,
    timestamp: new Date().toISOString(),
    data: blockData,
    previousHash: previousBlock.hash,
    hash,
    nonce: Math.floor(Math.random() * 1000000), // Simulated nonce
  };

  chain.push(newBlock);
  saveBlockchain(chain);

  // Register hash
  const registry = getHashRegistry();
  registry[hash] = invoiceId;
  saveHashRegistry(registry);

  return newBlock;
};

/**
 * Verify a blockchain hash
 * @param hash - Hash to verify
 * @returns Verification result
 */
export const verifyHash = async (hash: string): Promise<VerificationResult> => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate verification delay

  const chain = getBlockchain();
  const registry = getHashRegistry();

  // Search for hash in registry
  const invoiceId = registry[hash];

  if (invoiceId) {
    const block = chain.find((b) => b.hash === hash);
    return {
      isValid: true,
      block: block || null,
      message: `✓ Hash verified on blockchain. Invoice ${invoiceId} is authentic.`,
      timestamp: new Date().toISOString(),
    };
  }

  // Check if it looks like a valid hash format
  if (hash.startsWith('0x') && hash.length === 66) {
    return {
      isValid: false,
      block: null,
      message: '✗ Hash not found in blockchain ledger. Invoice may not be authentic.',
      timestamp: new Date().toISOString(),
    };
  }

  return {
    isValid: false,
    block: null,
    message: '✗ Invalid hash format. Please enter a valid blockchain hash.',
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get verification status by invoice ID
 * @param invoiceId - Invoice ID to check
 * @returns Verification result
 */
export const verifyInvoice = async (invoiceId: string): Promise<VerificationResult> => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const chain = getBlockchain();
  
  // Find block containing this invoice
  const block = chain.find((b) => {
    if (typeof b.data === 'object' && b.data !== null) {
      const data = b.data as { invoiceId?: string };
      return data.invoiceId === invoiceId;
    }
    return false;
  });

  if (block) {
    return {
      isValid: true,
      block,
      message: `✓ Invoice ${invoiceId} verified on blockchain at block #${block.index}`,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    isValid: false,
    block: null,
    message: `✗ Invoice ${invoiceId} not found in blockchain ledger`,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get blockchain statistics
 */
export const getBlockchainStats = async (): Promise<{
  totalBlocks: number;
  totalTransactions: number;
  lastBlockTime: string;
  chainIntegrity: boolean;
}> => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const chain = getBlockchain();
  
  return {
    totalBlocks: chain.length,
    totalTransactions: chain.length - 1, // Exclude genesis
    lastBlockTime: chain[chain.length - 1]?.timestamp || '',
    chainIntegrity: true, // Always true in simulation
  };
};

// Initialize blockchain on module load
initializeBlockchain();
