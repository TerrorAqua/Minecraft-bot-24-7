import "./globals.css";

export const metadata = {
  title: "MC Bot Dashboard",
  description: "Minecraft Bot Control Panel by TerrorAqua",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="scan-line" />
        {children}
      </body>
    </html>
  );
}
