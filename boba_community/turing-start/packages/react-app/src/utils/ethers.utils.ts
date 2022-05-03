import { TransactionStatus } from "@usedapp/core";

/** @dev Convenience method for evaluating a transaction status. */
export const isLoading = (tx: TransactionStatus) => {
  return tx.status === 'PendingSignature' || tx.status === 'Mining';
};

export const getPrettyTransactionStatus = (tx: TransactionStatus) => {
  switch (tx.status) {
    case "None":
      return "Nothing pending";
    case 'Success': return 'Transaction succeeded'
    case "PendingSignature":
      return "Pending user confirmation..";
    case "Mining":
      return "Mining..";
    case "Fail":
      return "Transaction failed";
    case 'Exception':
      return 'User error';
  }
};
