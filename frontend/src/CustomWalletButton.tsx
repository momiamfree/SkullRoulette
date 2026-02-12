import { ConnectButton } from "@rainbow-me/rainbowkit";

interface Props {
  balance: string;
}

export function CustomConnectButton({ balance }: Props) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openConnectModal,
        mounted,
      }) => {
        if (!mounted) return null;

        const connected = account && chain;

        return (
          <>
            {!connected && (
              <button
                onClick={openConnectModal}
                className="w-full px-10 py-1 rounded-full font-semibold transition custom-button mb-20"
              >
                Connect Wallet
              </button>
            )}

            {connected && (
              <button
                onClick={openAccountModal}
                className="w-full flex items-center justify-between px-11 py-1 -mb-3.5 rounded-full transition custom-button"
              >
                <span className="font-semibold">
                  {account.displayName}
                </span>

                <span className="text-sm px-3 py-0.1 ml-2 rounded-full custom-button-tickets">
                  {balance} T
                </span>
              </button>
            )}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
}
