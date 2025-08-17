import { useEffect, useState } from "react";
import "./Footer.css";

function Footer() {
  const [ip, setIp] = useState("...");

  useEffect(() => {
    fetch("https://api.ipify.org/?format=json")
      .then((res) => res.json())
      .then((data) => setIp(data.ip))
      .catch(() => setIp("IP não disponível"));
  }, []);

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">IP: {ip}</div>
        <div className="footer-right">© cariocaestrategia 2025</div>
      </div>
    </footer>
  );
}

export default Footer;
