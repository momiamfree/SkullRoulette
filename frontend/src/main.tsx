import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  sepolia
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'SkullRoulette',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
          <App />
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);  
