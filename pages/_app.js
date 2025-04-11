import "@/styles/globals.css";

import { SocketProvider } from "@/context/socket";
import { ToastContainer } from "react-toastify";

export default function App({ Component, pageProps }) {
  return (
    <SocketProvider>
      <ToastContainer />
      <Component {...pageProps} />
    </SocketProvider>
  );
}
