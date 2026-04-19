import { Link } from "wouter";
import guardianReversedLogo from "@assets/img-guardian-reversed-291x63-1_1773948931249.png";
const benzingaBadge = "/images/img-benzinga-badge.png";

export function Footer() {
  return (
    <footer className="bg-[#141414]">
      {/* Main footer content */}
      <div className="max-w-[1100px] mx-auto px-6 pt-16 pb-10">
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
                <li>
                  <Link href="/about" className="text-white text-[13px] transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/services/trading-services" className="text-white text-[13px] transition-colors">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/platforms" className="text-white text-[13px] transition-colors">
                    Platforms
                  </Link>
                </li>
                <li>
                  <Link href="/equities-options" className="text-white text-[13px] transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-white text-[13px] transition-colors">
                    Insights
                  </Link>
                </li>
              </ul>
            </div>

            {/* LEGAL */}
            <div>
              <h4 className="text-[#aaa] text-[11px] font-bold uppercase tracking-widest mb-5">LEGAL</h4>
              <ul className="flex flex-col gap-3">
                <li>
                  <Link href="/disclosures" className="text-white text-[13px] transition-colors">
                    Disclosures
                  </Link>
                </li>
                <li>
                  <Link href="/disclosures" className="text-white text-[13px] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* CONTACT */}
            <div>
              <h4 className="text-[#aaa] text-[11px] font-bold uppercase tracking-widest mb-5">CONTACT</h4>
              <ul className="flex flex-col gap-3">
                <li>
                  <a href="tel:8886020092" className="text-white text-[13px] transition-colors">
                    888-602-0092
                  </a>
                </li>
                <li>
                  <a href="mailto:info@guardiiantrading.com" className="text-white text-[13px] transition-colors">
                    info@guardiiantrading.com
                  </a>
                </li>
                <li>
                  <p className="text-white text-[13px] leading-snug">
                    1301 Route 36, Suite 109 Hazlet, NJ 07730
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Contained horizontal divider — purely white, does not touch the edges */}
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="border-t border-white" />
      </div>

      {/* Legal disclaimer */}
      <div className="max-w-[1100px] mx-auto px-6 py-8 text-center">
        <p className="text-[14px] font-medium text-white mb-2">
          Guardian Trading ~ A Division of Velocity Clearing, LLC ("Velocity"). Member{" "}
          <a href="https://www.finra.org" target="_blank" rel="noopener noreferrer" className="underline">FINRA</a>
          /{" "}
          <a href="https://www.sipc.org" target="_blank" rel="noopener noreferrer" className="underline">SIPC</a>.
        </p>
        <p className="text-[14px] font-semibold text-white mb-3">
          All securities and transactions are handled through Velocity.
        </p>
        <p className="text-[13px] font-medium text-white leading-relaxed mb-3 uppercase">
          ©{new Date().getFullYear()} VELOCITY CLEARING, LLC IS REGISTERED WITH THE SEC AND A MEMBER OF{" "}
          <span className="text-[#4a7fbd]">FINRA</span>
          <span className="text-white"> AND </span>
          <span className="text-[#4a7fbd]">SIPC</span>
          . MARKET VOLATILITY AND VOLUME MAY DELAY SYSTEMS ACCESS AND TRADE EXECUTION. CHECK THE BACKGROUND OF VELOCITY CLEARING ON{" "}
          <a href="https://brokercheck.finra.org" target="_blank" rel="noopener noreferrer" className="underline text-[#4a7fbd]">FINRA'S BROKER CHECK</a>
          {" "}AND SEE THE VELOCITY CLEARING, LLC{" "}
          <a href="#" className="underline text-[#4a7fbd]">RELATIONSHIP SUMMARY</a>.
        </p>
        <p className="text-[13px] font-medium text-white leading-relaxed mb-3 uppercase">
          OPTIONS INVOLVE RISK AND ARE NOT SUITABLE FOR ALL INVESTORS. FOR MORE INFORMATION READ THE{" "}
          <a href="#" className="underline text-[#4a7fbd]">CHARACTERISTICS AND RISKS OF STANDARDIZED OPTIONS</a>
          , ALSO KNOWN AS THE OPTIONS DISCLOSURE DOCUMENT (ODD). ALTERNATIVELY, PLEASE CONTACT{" "}
          <a href="mailto:info@guardiiantrading.com" className="underline text-[#4a7fbd]">INFO@GUARDIIANTRADING.COM</a>
          {" "}TO RECEIVE A COPY OF THE ODD.
        </p>
        <p className="text-[13px] font-medium text-white leading-relaxed uppercase">
          THE RISK OF LOSS IN TRADING FUTURES AND OPTIONS ON FUTURES CAN BE SUBSTANTIAL. EACH INVESTOR MUST CAREFULLY CONSIDER WHETHER THIS TYPE OF INVESTMENT IS APPROPRIATE FOR THEM. PAST PERFORMANCE IS NOT NECESSARILY INDICATIVE OF FUTURE RESULTS. GUARDIAN TRADING, A DIVISION OF VELOCITY CLEARING, IS A NATIONAL FUTURES ASSOCIATION ("NFA") INTRODUCING BROKER. ALL FUTURES TRANSACTIONS ARE INTRODUCED TO STONEX FINANCIAL INC.
        </p>
      </div>
    </footer>
  );
}
