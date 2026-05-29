import { Link } from "wouter";
import guardianReversedLogo from "@assets/img-guardian-reversed-291x63-1_1773948931249.png";
import benzingaBadge from "@assets/reviewed-by-benzinga-2024-200x166-1-320x266_1773948931249.png";

const mobileFooterLinks = [
  { name: "Home",     href: "/" },
  { name: "About",    href: "/about" },
  { name: "Platform", href: "/platforms" },
  { name: "Pricing",  href: "/equities-options" },
  { name: "Products", href: "/services/trading-services" },
  { name: "Get Us",   href: "/contact-us" },
];

export function Footer() {
  return (
    <footer className="bg-[#141414]">
      {/* Main footer content — hidden on mobile, shown md+ */}
      <div className="hidden md:block max-w-[1100px] mx-auto px-6 pt-16 pb-10">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left — logo + benzinga badge */}
          <div className="flex flex-col gap-6 lg:w-[220px] flex-shrink-0">
            <Link href="/">
              <img
                src={guardianReversedLogo}
                alt="Guardian Trading"
                className="h-[54px] w-auto object-contain"
              />
            </Link>
            <img
              src={benzingaBadge}
              alt="Reviewed by Benzinga 2024"
              className="w-[120px] h-auto object-contain"
            />
          </div>

          {/* Right — three columns */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-10">
            {/* COMPANY */}
            <div>
              <h4 className="text-[#aaa] text-[11px] font-bold uppercase tracking-widest mb-5">COMPANY</h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="/about" className="text-white text-[13px] transition-colors">About</Link></li>
                <li><Link href="/services/trading-services" className="text-white text-[13px] transition-colors">Services</Link></li>
                <li><Link href="/platforms" className="text-white text-[13px] transition-colors">Platforms</Link></li>
                <li><Link href="/equities-options" className="text-white text-[13px] transition-colors">Pricing</Link></li>
                <li><Link href="/blog" className="text-white text-[13px] transition-colors">Insights</Link></li>
              </ul>
            </div>
            {/* LEGAL */}
            <div>
              <h4 className="text-[#aaa] text-[11px] font-bold uppercase tracking-widest mb-5">LEGAL</h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="/disclosures" className="text-white text-[13px] transition-colors">Disclosures</Link></li>
                <li><Link href="/disclosures" className="text-white text-[13px] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            {/* CONTACT */}
            <div>
              <h4 className="text-[#aaa] text-[11px] font-bold uppercase tracking-widest mb-5">CONTACT</h4>
              <ul className="flex flex-col gap-3">
                <li><a href="tel:+15126866045" className="text-white text-[13px] transition-colors">+1 5126866045</a></li>
                <li><a href="mailto:support@guardiiantrading.com" className="text-white text-[13px] transition-colors">support@guardiiantrading.com</a></li>
                <li><p className="text-white text-[13px] leading-snug">1301 Route 36, Suite 109 Hazlet, NJ 07730</p></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE FOOTER — logo + nav links ── */}
      <div className="md:hidden px-5 pt-10 pb-6 flex flex-col items-center gap-6">
        <Link href="/">
          <img
            src={guardianReversedLogo}
            alt="Guardian Trading"
            style={{ height: "46px", width: "auto", objectFit: "contain" }}
          />
        </Link>
        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "6px 18px",
          }}
        >
          {mobileFooterLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              style={{
                color: "white",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                padding: "4px 0",
                letterSpacing: "0.02em",
              }}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Divider */}
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="border-t border-white/20" />
      </div>

      {/* Legal disclaimer */}
      <div className="max-w-[1100px] mx-auto px-5 py-8 text-center">
        <p className="text-[13px] font-medium text-white mb-2">
          Guardian Trading ~ A Division of Velocity Clearing, LLC ("Velocity"). Member{" "}
          <a href="https://www.finra.org" target="_blank" rel="noopener noreferrer" className="underline">FINRA</a>
          /{" "}
          <a href="https://www.sipc.org" target="_blank" rel="noopener noreferrer" className="underline">SIPC</a>.
        </p>
        <p className="text-[13px] font-semibold text-white mb-3">
          All securities and transactions are handled through Velocity.
        </p>
        <p className="text-[12px] font-medium text-white leading-relaxed mb-3 uppercase">
          ©{new Date().getFullYear()} VELOCITY CLEARING, LLC IS REGISTERED WITH THE SEC AND A MEMBER OF{" "}
          <span className="text-[#4a7fbd]">FINRA</span>
          <span className="text-white"> AND </span>
          <span className="text-[#4a7fbd]">SIPC</span>
          . MARKET VOLATILITY AND VOLUME MAY DELAY SYSTEMS ACCESS AND TRADE EXECUTION. CHECK THE BACKGROUND OF VELOCITY CLEARING ON{" "}
          <a href="https://brokercheck.finra.org" target="_blank" rel="noopener noreferrer" className="underline text-[#4a7fbd]">FINRA'S BROKER CHECK</a>
          {" "}AND SEE THE VELOCITY CLEARING, LLC{" "}
          <a href="#" className="underline text-[#4a7fbd]">RELATIONSHIP SUMMARY</a>.
        </p>
        <p className="text-[12px] font-medium text-white leading-relaxed mb-3 uppercase">
          OPTIONS INVOLVE RISK AND ARE NOT SUITABLE FOR ALL INVESTORS. FOR MORE INFORMATION READ THE{" "}
          <a href="#" className="underline text-[#4a7fbd]">CHARACTERISTICS AND RISKS OF STANDARDIZED OPTIONS</a>
          , ALSO KNOWN AS THE OPTIONS DISCLOSURE DOCUMENT (ODD). ALTERNATIVELY, PLEASE CONTACT{" "}
          <a href="mailto:support@guardiiantrading.com" className="underline text-[#4a7fbd]">SUPPORT@GUARDIIANTRADING.COM</a>
          {" "}TO RECEIVE A COPY OF THE ODD.
        </p>
        <p className="text-[12px] font-medium text-white leading-relaxed uppercase">
          THE RISK OF LOSS IN TRADING FUTURES AND OPTIONS ON FUTURES CAN BE SUBSTANTIAL. EACH INVESTOR MUST CAREFULLY CONSIDER WHETHER THIS TYPE OF INVESTMENT IS APPROPRIATE FOR THEM. PAST PERFORMANCE IS NOT NECESSARILY INDICATIVE OF FUTURE RESULTS. GUARDIAN TRADING, A DIVISION OF VELOCITY CLEARING, IS A NATIONAL FUTURES ASSOCIATION ("NFA") INTRODUCING BROKER. ALL FUTURES TRANSACTIONS ARE INTRODUCED TO STONEX FINANCIAL INC.
        </p>
      </div>
    </footer>
  );
}
