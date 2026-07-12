import { Link } from "wouter";
import { Layout } from "@/components/Layout";

import heroPattern from "@assets/pattern_1773965291387.png";
import scriptBuilderBasic from "@assets/das-hotkeys-script-builder-basic.png";
import scriptBuilderVariables from "@assets/das-hotkeys-script-builder-variables.png";
import configManagement from "@assets/das-hotkeys-configuration-management.png";

const CATEGORY_LINKS = [
  { name: "All Blogs", href: "/blog" },
  { name: "DAS Hotkeys", href: "/how-to-prepare-your-das-trader-pro-for-advanced-hotkeys-scripting" },
  { name: "Margin", href: "/blog" },
  { name: "Risk Management", href: "/blog" },
  { name: "Short Selling", href: "/blog" },
  { name: "Tools", href: "/blog" },
];

const H2 = "text-white font-display font-bold text-[32px] leading-tight mt-14 mb-4";
const P = "text-[#c9ced3] text-[15px] leading-[1.75] mb-4";
const UL = "list-disc pl-6 text-[#c9ced3] text-[15px] leading-[1.9] mb-4 space-y-1";
const H3 = "text-[#76d1f5] font-display font-bold text-[20px] mt-8 mb-2";

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-[#0c1114] border border-[#1f2a30] rounded-md p-4 mb-4 overflow-x-auto text-[13px] leading-[1.7] font-mono text-[#9fd7f5] whitespace-pre">
      {children}
    </pre>
  );
}

export default function DasHotkeysScripting() {
  return (
    <Layout
      title="How to prepare your DAS Trader Pro for advanced hotkeys scripting | Guardian Trading"
      description="DAS Trader Pro hotkeys, custom variables, and advanced scripting explained — by Peter Benci. Learn to automate orders, conditional actions, and more."
    >
      {/* Category sub-nav — marginTop clears the fixed navbar + sticky ticker, matching Home.tsx's news bar */}
      <div className="bg-[#1c1c1c] border-b border-white/5" style={{ marginTop: "78px" }}>
        <div className="max-w-[1200px] mx-auto px-6 flex flex-wrap items-center gap-x-8 gap-y-2 py-3">
          {CATEGORY_LINKS.map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="text-[#d5d9dc] text-[13px] font-medium hover:text-[#76d1f5] transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <article className="relative">
            <img
              src={heroPattern}
              alt=""
              aria-hidden="true"
              className="pointer-events-none select-none absolute top-0 right-0 w-[420px] max-w-[45vw] h-auto opacity-90 -z-0"
            />

            <div className="max-w-[860px] mx-auto px-6 py-14 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[#76d1f5] text-[12px] font-bold tracking-[0.12em] uppercase">
                  DAS Hotkeys
                </span>
                <span className="text-[#555] text-[12px]">|</span>
                <span className="text-[#9aa0a6] text-[12px]">11/10/2025</span>
              </div>

              <h1 className="text-white font-display font-bold text-[34px] sm:text-[44px] leading-[1.1] mb-6 max-w-[720px]">
                How to prepare your DAS Trader Pro for advanced hotkeys scripting
              </h1>

              <p className={P}>
                DAS Trader Pro is a trading platform in constant development, while the documentation of the new
                features is often lagging behind, the new features exist and can make traders lives much easier.
                There are many reasons to chose DAS Trader Pro for your trading. The{" "}
                <span className="text-[#76d1f5]">Risk controls</span> feature is probably the most important one.
                The next one for sure is{" "}
                <span className="text-[#76d1f5]">advanced hotkeys scripting with custom variables</span>.
              </p>

              <h2 className={H2}>What is advanced hotkeys scripting?</h2>
              <p className={P}>
                As many trading platforms, besides the rich amount of features, in standard operation we can use
                scripts (hotkeys) for our actions like
              </p>
              <ul className={UL}>
                <li>placing orders</li>
                <li>drawing lines to the charts</li>
                <li>placing alerts</li>
              </ul>
              <p className={P}>but with advanced hotkeys scripting and custom variables we can do much more</p>
              <ul className={UL}>
                <li>automating actions</li>
                <li>do conditional actions</li>
                <li>repeat actions up to 200 times</li>
                <li>perform complex calculations</li>
                <li>code our own indicators</li>
                <li>code our own functionalities</li>
              </ul>

              <h2 className={H2}>What are custom variables?</h2>
              <p className={P}>
                Usually, the hotkeys in any application have prescribed rules. You have to use one specific command
                or variable to do one thing. For example
              </p>

              <div className="rounded-md overflow-hidden border border-[#1f2a30] mb-4 bg-white inline-block max-w-full">
                <img src={scriptBuilderBasic} alt="HotKey Script Builder — basic script with hardcoded values" className="max-w-full h-auto block" />
              </div>

              <p className={P}>
                Obviously, we do not want to buy always 100 shares, so we can make the number 100 to be a variable.
                Same for the price 150 etc. With custom variables we can change the code to be more readable,
                especially if we need to use some calculations for the values to be used in the variables
              </p>

              <div className="rounded-md overflow-hidden border border-[#1f2a30] mb-4 bg-white inline-block max-w-full">
                <img src={scriptBuilderVariables} alt="HotKey Script Builder — script using custom variables" className="max-w-full h-auto block" />
              </div>

              <p className={P}>
                This way we can name the things the way we want, which is easier to remember and easier to
                understand, troubleshoot and use. Once we define a custom variable like{" "}
                <strong className="text-white">$MYVWAP</strong>, from that moment we can use it in any script
                without needing to do any action. Just read the value of{" "}
                <strong className="text-white">$MYVWAP</strong>.
              </p>

              <h2 className={H2}>What are hotkeys?</h2>
              <p className={P}>
                A hotkey is a script, which is a list of commands being logically ordered. For example
              </p>

              <CodeBlock>
{`use the price where I clicked as a stop loss
calculate how many shares I can afford to buy
place the buy limit order at current price
place a stop loss order after the buy order is filled
place a profit taking order at 3R distance`}
              </CodeBlock>

              <p className={P}>
                Despite living in the age of AI, this has to have a special syntax. In the real life, the above
                script would look something like this.
              </p>

              <CodeBlock>
{`$montage=getwindowobj("MONTAGE1");
$montage.CXL ALLSYMB;
$buyprice=$montage.Ask-0.01;
$risk=GetAccountObj($MYACCOUNT).equity/80;
$mystop=$montage.price;
$pricetostop=$buyprice-$mystop;
$target=3*$pricetostop+Ask;
$amount=$risk/$pricetostop;
$montage.StopPrice=$mystop;StopPrice=ROUND2;
$montage.Share=$amount;
$montage.ROUTE=$ROUTE;
$montage.Price=$buyprice;Price=ROUND2;
$montage.TIF="DAY+";
$MYBP=GetAccountObj($MYACCOUNT).BP;
$WANT=$montage.share;
if ($montage.last*$want>$MYBP)
{
$montage.share=$montage.bp;
}
$montage.BUY=Send;
$montage.TriggerOrder=RT:STOP STOPTYPE:RANGEMKT LowPrice:$mystop HighPrice:$target ACT:SELL QTY:POS TIF:DAY+ PREF:VFAN;`}
              </CodeBlock>

              <p className={P}>the above script can be in a form of a</p>
              <ul className={UL}>
                <li>a hotkey for a keyboard shortcut</li>
                <li>a named hotkey to be called by other scripts</li>
                <li>a hot button on a montage</li>
                <li>a window button on any window</li>
                <li>a script ran on opening of the application</li>
                <li>a script ran every second</li>
                <li>a script ran every price change of the symbol</li>
                <li>a script ran in an alert</li>
                <li>a variable</li>
              </ul>
              <p className={P}>
                As you can see there are already too many options so in this and following articles, I will try to
                describe the useful features and scripting techniques so you understand better their use.
              </p>

              <h2 className={H2}>Get the latest version</h2>
              <p className={P}>
                You can download it from here{" "}
                <a
                  href="https://www.dastrader.com/das-trader-pro/qntx-download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#76d1f5] hover:underline"
                >
                  QNTX download page.
                </a>{" "}
                Usually the latest is the best, even if it is the beta version. If you are concerned running beta
                versions, you can go for the latest "Production" version from the list.
              </p>

              <h2 className={H2}>Name the windows</h2>
              <p className={P}>
                When you right-click any window header, the window configuration opens. There you can name the
                window. The window names need to be unique.
              </p>

              <div className="rounded-md overflow-hidden border border-[#1f2a30] mb-4 bg-white inline-block max-w-full">
                <img src={configManagement} alt="DAS Trader Pro Configuration Management dialog" className="max-w-full h-auto block" />
              </div>

              <p className={P}>
                For example, I name my chart windows as <strong className="text-white">MY1MIN</strong>,{" "}
                <strong className="text-white">MY5MIN</strong>, <strong className="text-white">MY60MIN</strong>,{" "}
                <strong className="text-white">MYDAILY</strong> etc. while the montage window is named{" "}
                <strong className="text-white">MONTAGE1</strong>
              </p>

              <h2 className={H2}>Change these settings</h2>

              <h3 className={H3}>Configuration Management - Go to Setup→Other Configuration</h3>
              <p className={P}>Hotkey Advanced Script - Enabled</p>

              <h3 className={H3}>Chart config</h3>
              <p className={P}>Toolbar - Enabled Double-click to trade - Enabled Maximum number of trend lines - 600</p>

              <h3 className={H3}>Chart area</h3>
              <p className={P}>Enable order line movement</p>

              <h3 className={H3}>Montage</h3>
              <p className={P}>anchor the charts and the watch list set the montage style to stop order style</p>

              <h3 className={H3}>Name your chart studies</h3>
              <p className={P}>it is good to name the studies (indicators)</p>

              <h2 className={H2}>Set up the layout</h2>
              <p className={P}>
                Everybody likes it different, so this is not about where to place your chart windows. For many of
                the hotkeys and solutions I will write about, you will need
              </p>
              <ul className={UL}>
                <li>1 montage window</li>
                <li>few chart windows</li>
                <li>positions window</li>
                <li>orders window</li>
                <li>market viewer window (aka watch list window)</li>
                <li>short locate window if you are trading HTB symbols</li>
                <li>alerts window</li>
              </ul>

              <h3 className={H3}>For troubleshooting</h3>
              <ul className={UL}>
                <li>event window</li>
                <li>variables window</li>
              </ul>

              <p className={P}>
                <strong className="text-[#ff6b5e]">Save your desktop</strong> This is the most important step, after
                all the work with set up has been done. Every time you change some hot button or chart setting you
                will need to save the desktop to keep the changes for the next time. At this point, your DAS Trader
                Pro should be ready for using hotkeys with advanced syntax, which is covered in other articles from
                the DAS Hotkeys series. For more advanced scripting, You can visit my substack -{" "}
                <a
                  href="https://petersubstack.substack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#76d1f5] hover:underline"
                >
                  Peter's Substack
                </a>{" "}
                where I elaborate on newest features, ideas and do custom solutions for specific needs.{" "}
                <strong className="text-white">Author: PeterB</strong>
              </p>

              <div className="border-t border-white/10 mt-10 pt-6 text-[#8a9098] text-[12px] leading-[1.8] italic space-y-3">
                <p>
                  <strong className="text-[#c9ced3] not-italic">Disclosure Statement</strong> 1. Hotkey scripts
                  should always be thoroughly tested in a{" "}
                  <strong className="text-[#c9ced3] not-italic">paper trading environment</strong> prior to any live
                  deployment. <strong className="text-[#c9ced3] not-italic">Guardian Trading</strong> assumes no
                  responsibility for errors, malfunctions, or financial losses arising from the use, misuse, or
                  modification of custom hotkey configurations. Traders are solely responsible for the creation,
                  testing, and implementation of their own scripts.
                </p>
                <p>
                  This guide is provided{" "}
                  <strong className="text-[#c9ced3] not-italic">for informational and educational purposes only</strong>{" "}
                  and{" "}
                  <strong className="text-[#c9ced3] not-italic">
                    does not constitute trading advice or an endorsement of any specific configuration
                  </strong>
                  . The examples herein are illustrative in nature and{" "}
                  <strong className="text-[#c9ced3] not-italic">
                    should not be copied, replicated, or relied upon without independent verification and testing
                  </strong>
                  . Use of this material constitutes acknowledgment and acceptance of these terms. 2. No information
                  provided by Velocity Clearing, LLC ("Velocity" or the "Firm"), directly or indirectly, should be
                  considered a recommendation or solicitation to adopt any particular trading or investment strategy
                  or to invest in, or liquidate, a particular security or type of investment. Information provided
                  by Velocity on its Twitter, Facebook or Blog pages is for informational and educational purposes
                  only and is not intended as a recommendation of any particular security, transaction or strategy.
                  Commentary and opinions expressed are those of the author/speaker and not necessarily those of
                  the Firm. Velocity does not guarantee the accuracy of, or endorse, the statements of any third
                  party, including guest speakers or authors of commentary or news articles. All information
                  regarding the likelihood of potential future investment outcomes are hypothetical. Future results
                  are never guaranteed. Any examples that discuss potential trading profits or losses may not take
                  into account trading commissions or fees, which means that potential profits could be lower and
                  potential losses could be greater than illustrated in any example. Users are solely responsible
                  for making their own, independent decisions about whether to use any of the research, tools or
                  information provided, and for determining their own trading and investment strategies.
                </p>
              </div>

              <div className="bg-[#161616] border border-white/5 rounded-lg p-8 mt-12">
                <h4 className="text-white font-display font-bold text-[20px] mb-1">
                  Stay informed with Guardian Trading
                </h4>
                <p className="text-[#9aa0a6] text-[13px] mb-5">
                  Get weekly blog posts, platform updates, and trading tutorials.
                </p>
                <form
                  className="flex flex-col sm:flex-row gap-3 max-w-md"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="flex-1 bg-transparent border border-[#333] rounded-md px-4 py-2.5 text-[13px] text-white placeholder:text-[#666] focus:outline-none focus:border-[#76d1f5]"
                  />
                  <button
                    type="submit"
                    className="bg-[#1e6fd9] hover:bg-[#1a5fb8] transition-colors text-white text-[13px] font-semibold rounded-md px-6 py-2.5 whitespace-nowrap"
                  >
                    Sign Up
                  </button>
                </form>
              </div>

              <div className="mt-10">
                <Link
                  href="/"
                  className="inline-block border border-[#3a3a3a] text-[#d5d9dc] text-[13px] font-medium rounded-md px-6 py-2.5 hover:border-[#76d1f5] hover:text-[#76d1f5] transition-colors"
                >
                  Return To Site
                </Link>
              </div>
            </div>
          </article>
    </Layout>
  );
}
