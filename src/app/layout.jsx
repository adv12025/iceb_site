import "./globals.css";

export const metadata = {
  title: "ICE B Hub · NIT Trichy",
  description: "Announcements, notes and college links for ICE B, NIT Trichy.",
};
export const viewport = { themeColor: "#0b0d17" };

/* apply the saved / system theme before paint to avoid a flash */
const themeInit = `(function(){try{var t=localStorage.getItem("theme");if(!t&&matchMedia("(prefers-color-scheme: dark)").matches)t="dark";if(t)document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
