import { Layout } from "@/components/Layout";

const BG = "https://www.guardiantrading.com/wp-content/uploads/2025/07/background-image.png";
const DAS_ICON = "https://www.guardiantrading.com/wp-content/uploads/2026/04/DAS-icon-50x50.png";
const STERLING_ICON = "https://www.guardiantrading.com/wp-content/uploads/2026/04/sterling-icon-50x50.png";
const SILEXX_ICON = "https://www.guardiantrading.com/wp-content/uploads/2026/04/Silexx_hor_rgb_rev-118x50-1-118x50.png";
const BENZINGA = "https://www.guardiantrading.com/wp-content/uploads/2026/01/reviewed-by-benzinga-2024-200x166-1-320x266.png";

const ContactBtn = () => (
  <a
    href="/contact"
    className="inline-block border text-white text-[13px] font-semibold px-5 py-2 tracking-wide transition-colors hover:bg-white/10"
    style={{ borderColor: "#4a7fbd" }}
  >
    Contact Us For a Custom Quote
  </a>
);

const RateTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <table className="w-full border-collapse" style={{ fontSize: "14px" }}>
    <thead>
      <tr>
        {headers.map((h) => (
          <th
            key={h}
            className="text-left text-white font-semibold py-2 px-3 border"
            style={{ backgroundColor: "#1c2e3e", borderColor: "#2a3a4e" }}
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#1a1a1a" : "#1e1e1e" }}>
          {row.map((cell, j) => (
            <td
              key={j}
              className="text-white py-2 px-3 border"
              style={{ borderColor: "#2a2a2a" }}
            >
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export default function EquitiesOptions() {
  return (
    <Layout title="Pricing — Equities, Options & Futures | Guardian Trading">

      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center text-center overflow-hidden"
        style={{
          marginTop: "78px",
          minHeight: "260px",
          backgroundImage: `url('${BG}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} />
        <div className="relative z-10 py-14 px-4">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white tracking-tight">
            Pricing
          </h1>
          <p className="text-white text-[16px] mt-3 font-medium opacity-80">
            Equities, Options &amp; Futures
          </p>
        </div>
      </section>

      {/* ── EQUITIES ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-16 px-4 border-b border-white/5">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-2xl font-display font-bold text-white mb-2">Equities</h2>
          <p className="text-white text-[13px] font-semibold uppercase tracking-wider mb-3">Per Share Commissions</p>
          <p className="text-white text-[15px] leading-relaxed mb-8 max-w-[640px]">
            Our commission structure for equities is tailored to active traders with competitive rates.
            Contact us if you have any questions regarding pricing.
          </p>

          <div className="bg-[#1a1a1a] border border-white/10 p-6 mb-6 inline-block w-full max-w-[600px]">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-white text-[14px] font-semibold">Guardian Equity Rate Table</span>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <img src={DAS_ICON} alt="DAS Trader" style={{ width: "50px", height: "50px", objectFit: "contain" }} />
              <img src={STERLING_ICON} alt="Sterling Trader" style={{ width: "50px", height: "50px", objectFit: "contain" }} />
            </div>
            <RateTable
              headers={["MONTHLY", "COMMISSION FEES", "MIN. ORDER FEE"]}
              rows={[
                ["< 500K", "+ .0015", ".30"],
                ["500K to 1M", "+ .0012", ".30"],
                ["Over 1M", "Contact for Pricing", ""],
              ]}
            />
          </div>

          <div className="mt-6">
            <ContactBtn />
          </div>
        </div>
      </section>

      {/* ── OPTIONS ── */}
      <section style={{ backgroundColor: "#1c1c1c" }} className="py-16 px-4 border-b border-white/5">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-2xl font-display font-bold text-white mb-2">Options</h2>
          <p className="text-white text-[13px] font-semibold uppercase tracking-wider mb-3">Per Contract Commissions</p>
          <p className="text-white text-[15px] leading-relaxed mb-8 max-w-[640px]">
            Our commission structure for options is tailored to the retail trading community. Contact us if
            you have any questions regarding pricing.
          </p>

          <div className="bg-[#1a1a1a] border border-white/10 p-6 mb-6 inline-block w-full max-w-[600px]">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-white text-[14px] font-semibold">Guardian Options Rate Table</span>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <img src={DAS_ICON} alt="DAS Trader" style={{ width: "50px", height: "50px", objectFit: "contain" }} />
              <img src={STERLING_ICON} alt="Sterling Trader" style={{ width: "50px", height: "50px", objectFit: "contain" }} />
              <img src={SILEXX_ICON} alt="Silexx" style={{ height: "40px", width: "auto", objectFit: "contain" }} />
            </div>
            <RateTable
              headers={["VOLUME (Contract per Month)", "PRICE PER CONTRACT"]}
              rows={[
                ["Under 10,000", "$0.45"],
                ["Over 10,000", "Contact for Pricing"],
              ]}
            />
          </div>

          <p className="text-white/60 text-[12px] leading-relaxed mt-4 max-w-[700px]">
            * Options Commissions shall be billed and credited through the cash on the Options Regulatory Fee on behalf of the Options Clearing Corporation on all exchange on option contracts. ‡
          </p>

          <div className="mt-6">
            <ContactBtn />
          </div>
        </div>
      </section>

      {/* ── FUTURES ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-16 px-4 border-b border-white/5">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-2xl font-display font-bold text-white mb-2">Futures ($20,000 Minimum Funding)</h2>
          <p className="text-white text-[15px] leading-relaxed mb-3 max-w-[700px]">
            Futures accounts are introduced to Stonex Financial Inc. by Guardian Trading, a division of Velocity Clearing.
          </p>
          <p className="text-white text-[13px] font-semibold uppercase tracking-wider mb-3">Per Contract Commissions</p>
          <p className="text-white text-[15px] leading-relaxed mb-3 max-w-[640px]">
            The risk of loss in trading futures and options on futures can be substantial. Each investor must consider whether this type of investment is
            appropriate for them.
          </p>
          <p className="text-white text-[15px] leading-relaxed mb-8 max-w-[640px]">
            Pass-through fees including exchange, regulatory fees, etc. as applicable, are charged separately.
          </p>

          <div className="bg-[#1a1a1a] border border-white/10 p-6 mb-6 inline-block w-full max-w-[480px]">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-white text-[14px] font-semibold">Guardian Futures Rate Table</span>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <img src={DAS_ICON} alt="DAS Trader" style={{ width: "50px", height: "50px", objectFit: "contain" }} />
            </div>
            <RateTable
              headers={["VOLUME", "PRICE PER SIDE"]}
              rows={[
                ["Starting at", "$8.75"],
                ["High Volume Traders", "Contact Us for Pricing"],
              ]}
            />
          </div>

          <div className="mt-6">
            <ContactBtn />
          </div>
        </div>
      </section>

      {/* ── REGULATORY FEES ── */}
      <section style={{ backgroundColor: "#1c1c1c" }} className="py-16 px-4 border-b border-white/5">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-2xl font-display font-bold text-white mb-8">Regulatory Fees</h2>
          <p className="text-white text-[15px] leading-relaxed mb-8 max-w-[700px]">
            Certain regulations impose various fees to cover their costs of regulating the brokerage industry. The anticipated
            costs of the regulatory fees described below are charged separately.
          </p>
          <div className="flex flex-col sm:flex-row gap-10">
            <div>
              <p className="text-[#76d1f5] text-[13px] font-bold uppercase tracking-wider mb-2">SEC</p>
              <p className="text-white text-[20px] font-bold">$0.0000278</p>
              <p className="text-white/60 text-[13px]">/ 1 share</p>
            </div>
            <div>
              <p className="text-[#76d1f5] text-[13px] font-bold uppercase tracking-wider mb-2">TAF</p>
              <p className="text-white text-[20px] font-bold">$0.000166</p>
              <p className="text-white/60 text-[13px]">/ 1 share (max $8.30 per trade)</p>
            </div>
            <div>
              <p className="text-[#76d1f5] text-[13px] font-bold uppercase tracking-wider mb-2">ORF</p>
              <p className="text-white text-[20px] font-bold">$0.0002025</p>
              <p className="text-white/60 text-[13px]">/ share (billed monthly)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACCOUNT RELATED FEES ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-16 px-4 border-b border-white/5">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-2xl font-display font-bold text-white mb-8">Account Related Fees</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: "13px" }}>
              <tbody>
                {[
                  ["Incoming ACH Transfer", "$200.00", "FINRA DEF Fee", "$100.00", "SILAET Pro Fee", "$75.00"],
                  ["Outgoing ACH Transfer\nFrom $70.00 (full Portal)", "From $25.00 (Domestic)", "Outgoing Wire", "From $35.00", "IRA Termination Fee", "$75.00"],
                  ["FINC Transfer to\n$100.00 (Per Security)", "DIA Award Fee\n$75.00 (Per Security)", "Corporate Action Voluntary", "$35.00", "Corporate Action Mandatory", "$35.00"],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#1a1a1a" : "#1e1e1e" }}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="text-white py-3 px-4 border align-top"
                        style={{ borderColor: "#2a2a2a", whiteSpace: "pre-line" }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-white/50 text-[11px] mt-5">* MINIMUM COMMISSIONS ARE APPLIED ON NEGOTIATION</p>
          <p className="text-white/50 text-[11px] mt-1">† LOWER COMMISSIONS CAN BE NEGOTIATED AT ANY TIME</p>
        </div>
      </section>

      {/* ── BENZINGA ── */}
      <section style={{ backgroundColor: "#1c1c1c" }} className="py-12 px-4">
        <div className="max-w-[1100px] mx-auto flex justify-center">
          <a href="https://www.benzinga.com/money/guardian-trading-review" target="_blank" rel="noopener noreferrer">
            <img src={BENZINGA} alt="Reviewed by Benzinga 2024" style={{ width: "120px", height: "auto" }} />
          </a>
        </div>
      </section>

    </Layout>
  );
}
