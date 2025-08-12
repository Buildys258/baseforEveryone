import { createConfig, http } from "wagmi"
import { base, mainnet } from "wagmi/chains"
import { injected } from "wagmi/connectors"

export const config = createConfig({
  chains: [base, mainnet],
  connectors: [
    injected({
      target: {
        id: "okxWallet",
        name: "OKX Wallet",
        provider: (window) => (window.okxwallet ? window.okxwallet : undefined),
      },
    }),
  ],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
})
