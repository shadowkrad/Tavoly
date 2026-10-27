import net from "net";

/**
 * Invia un buffer di byte ESC/POS a una stampante termica di rete (TCP raw socket, porta standard 9100)
 * Eseguibile ESCLUSIVAMENTE lato server (Node.js runtime).
 */
export async function sendEscPosToNetworkPrinter(
  ip: string,
  port: number = 9100,
  buffer: Buffer,
  timeoutMs: number = 4000
): Promise<{ success: boolean; message?: string; error?: string }> {
  return new Promise((resolve) => {
    if (!ip || !ip.trim()) {
      return resolve({ success: false, error: "Indirizzo IP stampante mancante" });
    }

    const cleanIp = ip.trim();
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.connect(port, cleanIp, () => {
      socket.write(buffer, (err) => {
        if (err) {
          if (!isResolved) {
            isResolved = true;
            socket.destroy();
            resolve({ success: false, error: `Errore trasmissione dati a ${cleanIp}: ${err.message}` });
          }
        } else {
          // Attendi piccolo flush prima di chiudere
          setTimeout(() => {
            if (!isResolved) {
              isResolved = true;
              socket.end();
              resolve({
                success: true,
                message: `Comanda inviata con successo alla stampante termica ${cleanIp}:${port}`,
              });
            }
          }, 300);
        }
      });
    });

    socket.on("timeout", () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({
          success: false,
          error: `Timeout connessione (${timeoutMs / 1000}s): la stampante ${cleanIp}:${port} non risponde. Verifica che sia accesa e collegata alla rete Wi-Fi/LAN.`,
        });
      }
    });

    socket.on("error", (err: any) => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({
          success: false,
          error: `Impossibile raggiungere ${cleanIp}:${port} (${err.code || err.message}).`,
        });
      }
    });
  });
}
