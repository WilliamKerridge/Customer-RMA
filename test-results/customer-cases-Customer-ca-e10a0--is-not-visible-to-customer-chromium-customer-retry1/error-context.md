# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer-cases.test.ts >> Customer case list >> SAP financial data is not visible to customer
- Location: src\tests\e2e\customer-cases.test.ts:21:7

# Error details

```
Error: expect(received).not.toContain(expected) // indexOf

Expected substring: not "sap_order_value"
Received string:        "Cosworth ReturnsWKWill KerridgeCustomerHomeMy ReturnsMy ReturnsTrack your cases and manage your returns with Cosworth Electronics.New ReturnAll3Open3On HoldClosedCASE-202604-0056RMA-202604-0055In RepairCDU 7.0Repair · Required by 10 May 2026SubmittedRMA IssuedReceivedIn ReworkQCReturnedSubmitted 10 Apr 2026View Details →CASE-202604-0051SubmittedAntares 8 TLARepair · Required by 6 Jun 2026SubmittedRMA IssuedReceivedIn RepairQCReturnedSubmitted 7 Apr 2026View Details →CASE-202604-0047RMA-202604-0047In RepairCDU 10.3Repair · Required by 22 May 2026SubmittedRMA IssuedReceivedFinal TestQCReturnedSubmitted 7 Apr 2026View Details →Cosworth Electronics LtdBrookfield Technology CentreTwentypence Road, CottenhamCambridge, CB24 8PSUnited KingdomCosworth Electronics LLC5355 W 86th StIndianapolis, IN 46268United StatesCOSWORTH® is a registered trade mark of Cosworth Group Holdings LimitedLegal PoliciesUser GuidesrequestAnimationFrame(function(){$RT=performance.now()});(self.__next_f=self.__next_f||[]).push([0])self.__next_f.push([1,\"1:\\\"$Sreact.fragment\\\"\\n2:I[3265,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\"],\\\"Navbar\\\"]\\n3:I[39756,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\"],\\\"default\\\"]\\n4:I[37457,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\"],\\\"default\\\"]\\n5:I[603,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\",\\\"/_next/static/chunks/0.p2nb7t.c_hl.js\\\"],\\\"default\\\"]\\nb:I[68027,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\"],\\\"default\\\",1]\\ne:I[39756,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\"],\\\"LoadingBoundaryProvider\\\"]\\n10:I[97367,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\"],\\\"OutletBoundary\\\"]\\n11:\\\"$Sreact.suspense\\\"\\n14:I[97367,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\"],\\\"ViewportBoundary\\\"]\\n16:I[97367,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\"],\\\"MetadataBoundary\\\"]\\n18:I[27201,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\"],\\\"IconMark\\\"]\\n:HL[\\\"/_next/static/chunks/0jo40fc915-jc.css\\\",\\\"style\\\"]\\n:HL[\\\"/_next/static/chunks/0.v0jzjaunqct.css\\\",\\\"style\\\"]\\n:HL[\\\"/_next/static/media/0c89a48fa5027cee-s.p.0rd3rjvnnhw7n.woff2\\\",\\\"font\\\",{\\\"crossOrigin\\\":\\\"\\\",\\\"type\\\":\\\"font/woff2\\\"}]\\n:HL[\\\"/_next/static/media/36363bfb06833f56-s.p.0-pny06~-x26a.woff2\\\",\\\"font\\\",{\\\"crossOrigin\\\":\\\"\\\",\\\"type\\\":\\\"font/woff2\\\"}]\\n:HL[\\\"/_next/static/media/5c285b27cdda1fe8-s.p.0yo6-5yoeeudq.woff2\\\",\\\"font\\\",{\\\"crossOrigin\\\":\\\"\\\",\\\"type\\\":\\\"font/woff2\\\"}]\\n:HL[\\\"/_next/static/media/a73419dd2ba2d841-s.p.0x-0vqtj_fzf1.woff2\\\",\\\"font\\\",{\\\"crossOrigin\\\":\\\"\\\",\\\"type\\\":\\\"font/woff2\\\"}]\\n\"])self.__next_f.push([1,\"0:{\\\"P\\\":null,\\\"c\\\":[\\\"\\\",\\\"cases\\\"],\\\"q\\\":\\\"\\\",\\\"i\\\":false,\\\"f\\\":[[[\\\"\\\",{\\\"children\\\":[\\\"(customer)\\\",{\\\"children\\\":[\\\"cases\\\",{\\\"children\\\":[\\\"__PAGE__\\\",{}]},\\\"$undefined\\\",\\\"$undefined\\\",4]},\\\"$undefined\\\",\\\"$undefined\\\",8]},\\\"$undefined\\\",\\\"$undefined\\\",24],[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/0jo40fc915-jc.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossOrigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"link\\\",\\\"1\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/0.v0jzjaunqct.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossOrigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-1\\\",{\\\"src\\\":\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-2\\\",{\\\"src\\\":\\\"/_next/static/chunks/0uj08p1655b2n.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"html\\\",null,{\\\"lang\\\":\\\"en\\\",\\\"className\\\":\\\"space_grotesk_1d8c5cc8-module__-5dOoa__variable dm_sans_2263d8ea-module__K7b4FW__variable dm_mono_ed3df95c-module__D4oVwa__variable h-full antialiased\\\",\\\"children\\\":[\\\"$\\\",\\\"body\\\",null,{\\\"className\\\":\\\"min-h-full flex flex-col bg-grey-50\\\",\\\"children\\\":[[\\\"$\\\",\\\"$L2\\\",null,{}],[\\\"$\\\",\\\"main\\\",null,{\\\"className\\\":\\\"flex-1 pt-16\\\",\\\"children\\\":[\\\"$\\\",\\\"$L3\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L4\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":[[[\\\"$\\\",\\\"title\\\",null,{\\\"children\\\":\\\"404: This page could not be found.\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"fontFamily\\\":\\\"system-ui,\\\\\\\"Segoe UI\\\\\\\",Roboto,Helvetica,Arial,sans-serif,\\\\\\\"Apple Color Emoji\\\\\\\",\\\\\\\"Segoe UI Emoji\\\\\\\"\\\",\\\"height\\\":\\\"100vh\\\",\\\"textAlign\\\":\\\"center\\\",\\\"display\\\":\\\"flex\\\",\\\"flexDirection\\\":\\\"column\\\",\\\"alignItems\\\":\\\"center\\\",\\\"justifyContent\\\":\\\"center\\\"},\\\"children\\\":[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"style\\\",null,{\\\"dangerouslySetInnerHTML\\\":{\\\"__html\\\":\\\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\\\"}}],[\\\"$\\\",\\\"h1\\\",null,{\\\"className\\\":\\\"next-error-h1\\\",\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"margin\\\":\\\"0 20px 0 0\\\",\\\"padding\\\":\\\"0 23px 0 0\\\",\\\"fontSize\\\":24,\\\"fontWeight\\\":500,\\\"verticalAlign\\\":\\\"top\\\",\\\"lineHeight\\\":\\\"49px\\\"},\\\"children\\\":404}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\"},\\\"children\\\":[\\\"$\\\",\\\"h2\\\",null,{\\\"style\\\":{\\\"fontSize\\\":14,\\\"fontWeight\\\":400,\\\"lineHeight\\\":\\\"49px\\\",\\\"margin\\\":0},\\\"children\\\":\\\"This page could not be found.\\\"}]}]]}]}]],[]],\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]}],[\\\"$\\\",\\\"footer\\\",null,{\\\"className\\\":\\\"bg-navy mt-auto\\\",\\\"children\\\":[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"max-w-7xl mx-auto px-6 py-10\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-white/10\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"p\\\",null,{\\\"className\\\":\\\"font-heading font-semibold text-xs tracking-widest text-white uppercase mb-3\\\",\\\"children\\\":\\\"Cosworth Electronics Ltd\\\"}],[\\\"$\\\",\\\"address\\\",null,{\\\"className\\\":\\\"not-italic text-xs text-white/50 leading-6\\\",\\\"children\\\":[\\\"Brookfield Technology Centre\\\",[\\\"$\\\",\\\"br\\\",null,{}],\\\"Twentypence Road, Cottenham\\\",[\\\"$\\\",\\\"br\\\",null,{}],\\\"Cambridge, CB24 8PS\\\",[\\\"$\\\",\\\"br\\\",null,{}],\\\"United Kingdom\\\"]}]]}],[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"p\\\",null,{\\\"className\\\":\\\"font-heading font-semibold text-xs tracking-widest text-white uppercase mb-3\\\",\\\"children\\\":\\\"Cosworth Electronics LLC\\\"}],[\\\"$\\\",\\\"address\\\",null,{\\\"className\\\":\\\"not-italic text-xs text-white/50 leading-6\\\",\\\"children\\\":[\\\"5355 W 86th St\\\",[\\\"$\\\",\\\"br\\\",null,{}],\\\"Indianapolis, IN 46268\\\",[\\\"$\\\",\\\"br\\\",null,{}],\\\"United States\\\"]}]]}]]}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4\\\",\\\"children\\\":[[\\\"$\\\",\\\"p\\\",null,{\\\"className\\\":\\\"text-xs text-white/40\\\",\\\"children\\\":\\\"COSWORTH® is a registered trade mark of Cosworth Group Holdings Limited\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex items-center gap-6\\\",\\\"children\\\":[[\\\"$\\\",\\\"a\\\",null,{\\\"href\\\":\\\"#\\\",\\\"className\\\":\\\"text-xs text-white/40 hover:text-white/70 transition-colors duration-200\\\",\\\"children\\\":\\\"Legal Policies\\\"}],[\\\"$\\\",\\\"a\\\",null,{\\\"href\\\":\\\"#\\\",\\\"className\\\":\\\"text-xs text-white/40 hover:text-white/70 transition-colors duration-200\\\",\\\"children\\\":\\\"User Guides\\\"}]]}]]}]]}]}]]}]}]]}],{\\\"children\\\":[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[null,[\\\"$\\\",\\\"$L3\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$5\\\",\\\"errorStyles\\\":[],\\\"errorScripts\\\":[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/0.p2nb7t.c_hl.js\\\",\\\"async\\\":true}]],\\\"template\\\":[\\\"$\\\",\\\"$L4\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":[[[\\\"$\\\",\\\"title\\\",null,{\\\"children\\\":\\\"404: This page could not be found.\\\"}],\\\"$L6\\\"],[]],\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]]}],{\\\"children\\\":[\\\"$L7\\\",{\\\"children\\\":[\\\"$L8\\\",{},null,false,null]},null,false,\\\"$@9\\\"]},null,false,null]},null,false,null],\\\"$La\\\",false]],\\\"m\\\":\\\"$undefined\\\",\\\"G\\\":[\\\"$b\\\",[\\\"$Lc\\\",\\\"$Ld\\\"]],\\\"S\\\":false,\\\"h\\\":null,\\\"s\\\":\\\"$undefined\\\",\\\"l\\\":\\\"$undefined\\\",\\\"p\\\":\\\"$undefined\\\",\\\"d\\\":\\\"$undefined\\\",\\\"b\\\":\\\"n7yC1RgnGOMBMLNEVLi7B\\\"}\\n\"])self.__next_f.push([1,\"6:[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":\\\"$0:f:0:1:0:props:children:1:props:children:props:children:1:props:children:props:notFound:0:1:props:style\\\",\\\"children\\\":[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"style\\\",null,{\\\"dangerouslySetInnerHTML\\\":{\\\"__html\\\":\\\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\\\"}}],[\\\"$\\\",\\\"h1\\\",null,{\\\"className\\\":\\\"next-error-h1\\\",\\\"style\\\":\\\"$0:f:0:1:0:props:children:1:props:children:props:children:1:props:children:props:notFound:0:1:props:children:props:children:1:props:style\\\",\\\"children\\\":404}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":\\\"$0:f:0:1:0:props:children:1:props:children:props:children:1:props:children:props:notFound:0:1:props:children:props:children:2:props:style\\\",\\\"children\\\":[\\\"$\\\",\\\"h2\\\",null,{\\\"style\\\":\\\"$0:f:0:1:0:props:children:1:props:children:props:children:1:props:children:props:notFound:0:1:props:children:props:children:2:props:children:props:style\\\",\\\"children\\\":\\\"This page could not be found.\\\"}]}]]}]}]\\n\"])self.__next_f.push([1,\"7:[\\\"$\\\",\\\"$Le\\\",null,{\\\"loading\\\":[[\\\"$\\\",\\\"$1\\\",\\\"l\\\",{\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8\\\",\\\"children\\\":[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"max-w-4xl mx-auto\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-7 w-32 bg-white/10 rounded animate-pulse mb-2\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-4 w-48 bg-white/10 rounded animate-pulse\\\"}]]}]}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"max-w-4xl mx-auto px-6 py-8 space-y-4\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",\\\"0\\\",{\\\"className\\\":\\\"bg-white rounded-xl border border-grey-200 shadow-sm p-5\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex items-start justify-between mb-3\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-5 w-36 bg-grey-100 rounded animate-pulse\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-5 w-28 bg-grey-100 rounded-full animate-pulse\\\"}]]}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-4 w-48 bg-grey-100 rounded animate-pulse mb-2\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-3 w-32 bg-grey-100 rounded animate-pulse\\\"}]]}],[\\\"$\\\",\\\"div\\\",\\\"1\\\",{\\\"className\\\":\\\"bg-white rounded-xl border border-grey-200 shadow-sm p-5\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex items-start justify-between mb-3\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-5 w-36 bg-grey-100 rounded animate-pulse\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-5 w-28 bg-grey-100 rounded-full animate-pulse\\\"}]]}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-4 w-48 bg-grey-100 rounded animate-pulse mb-2\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-3 w-32 bg-grey-100 rounded animate-pulse\\\"}]]}],[\\\"$\\\",\\\"div\\\",\\\"2\\\",{\\\"className\\\":\\\"bg-white rounded-xl border border-grey-200 shadow-sm p-5\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex items-start justify-between mb-3\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-5 w-36 bg-grey-100 rounded animate-pulse\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-5 w-28 bg-grey-100 rounded-full animate-pulse\\\"}]]}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-4 w-48 bg-grey-100 rounded animate-pulse mb-2\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-3 w-32 bg-grey-100 rounded animate-pulse\\\"}]]}],[\\\"$\\\",\\\"div\\\",\\\"3\\\",{\\\"className\\\":\\\"bg-white rounded-xl border border-grey-200 shadow-sm p-5\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex items-start justify-between mb-3\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-5 w-36 bg-grey-100 rounded animate-pulse\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-5 w-28 bg-grey-100 rounded-full animate-pulse\\\"}]]}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-4 w-48 bg-grey-100 rounded animate-pulse mb-2\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"h-3 w-32 bg-grey-100 rounded animate-pulse\\\"}]]}]]}]]}],[],[]],\\\"children\\\":[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[null,[\\\"$\\\",\\\"$L3\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L4\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]]}]}]\\n\"])self.__next_f.push([1,\"8:[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[\\\"$Lf\\\",[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/0.cmhru.v-..u.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"$L10\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$11\\\",null,{\\\"name\\\":\\\"Next.MetadataOutlet\\\",\\\"children\\\":\\\"$@12\\\"}]}]]}]\\n13:[]\\n9:\\\"$W13\\\"\\na:[\\\"$\\\",\\\"$1\\\",\\\"h\\\",{\\\"children\\\":[null,[\\\"$\\\",\\\"$L14\\\",null,{\\\"children\\\":\\\"$L15\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"hidden\\\":true,\\\"children\\\":[\\\"$\\\",\\\"$L16\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$11\\\",null,{\\\"name\\\":\\\"Next.Metadata\\\",\\\"children\\\":\\\"$L17\\\"}]}]}],[\\\"$\\\",\\\"meta\\\",null,{\\\"name\\\":\\\"next-size-adjust\\\",\\\"content\\\":\\\"\\\"}]]}]\\nc:[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/0jo40fc915-jc.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossOrigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"}]\\nd:[\\\"$\\\",\\\"link\\\",\\\"1\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/0.v0jzjaunqct.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossOrigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"}]\\n15:[[\\\"$\\\",\\\"meta\\\",\\\"0\\\",{\\\"charSet\\\":\\\"utf-8\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"name\\\":\\\"viewport\\\",\\\"content\\\":\\\"width=device-width, initial-scale=1\\\"}]]\\n12:null\\n17:[[\\\"$\\\",\\\"title\\\",\\\"0\\\",{\\\"children\\\":\\\"Cosworth Returns Portal\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"name\\\":\\\"description\\\",\\\"content\\\":\\\"RMA and Returns Management for Cosworth Electronics\\\"}],[\\\"$\\\",\\\"link\\\",\\\"2\\\",{\\\"rel\\\":\\\"icon\\\",\\\"href\\\":\\\"/favicon.ico?favicon.0x3dzn~oxb6tn.ico\\\",\\\"sizes\\\":\\\"256x256\\\",\\\"type\\\":\\\"image/x-icon\\\"}],[\\\"$\\\",\\\"$L18\\\",\\\"3\\\",{}]]\\n\"])self.__next_f.push([1,\"19:I[22016,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\",\\\"/_next/static/chunks/0.cmhru.v-..u.js\\\"],\\\"\\\"]\\n1a:I[33591,[\\\"/_next/static/chunks/0s9lsovv.rizf.js\\\",\\\"/_next/static/chunks/0d3shmwh5_nmn.js\\\",\\\"/_next/static/chunks/0uj08p1655b2n.js\\\",\\\"/_next/static/chunks/0.cmhru.v-..u.js\\\"],\\\"default\\\"]\\n\"])self.__next_f.push([1,\"f:[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8 relative overflow-hidden\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"absolute -top-15 -right-15 w-75 h-75 pointer-events-none\\\",\\\"style\\\":{\\\"background\\\":\\\"radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)\\\"}}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"absolute bottom-0 left-0 right-0 h-px opacity-40\\\",\\\"style\\\":{\\\"background\\\":\\\"linear-gradient(90deg, transparent, #00b4d8, transparent)\\\"}}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"max-w-[1200px] mx-auto flex items-end justify-between\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex items-center gap-2 text-[12px] text-white/50 mb-2.5 font-mono\\\",\\\"children\\\":[\\\"Home\\\",[\\\"$\\\",\\\"svg\\\",null,{\\\"width\\\":\\\"11\\\",\\\"height\\\":\\\"11\\\",\\\"viewBox\\\":\\\"0 0 24 24\\\",\\\"fill\\\":\\\"none\\\",\\\"stroke\\\":\\\"currentColor\\\",\\\"strokeWidth\\\":\\\"2.5\\\",\\\"children\\\":[\\\"$\\\",\\\"polyline\\\",null,{\\\"points\\\":\\\"9 18 15 12 9 6\\\"}]}],[\\\"$\\\",\\\"span\\\",null,{\\\"className\\\":\\\"text-brand-accent\\\",\\\"children\\\":\\\"My Returns\\\"}]]}],[\\\"$\\\",\\\"h1\\\",null,{\\\"className\\\":\\\"font-heading text-[26px] font-bold text-white leading-tight\\\",\\\"children\\\":\\\"My Returns\\\"}],[\\\"$\\\",\\\"p\\\",null,{\\\"className\\\":\\\"mt-1.5 text-[13px] text-white/60\\\",\\\"children\\\":\\\"Track your cases and manage your returns with Cosworth Electronics.\\\"}]]}],[\\\"$\\\",\\\"$L19\\\",null,{\\\"href\\\":\\\"/submit\\\",\\\"className\\\":\\\"inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-blue text-white hover:bg-blue-light transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,102,204,0.3)]\\\",\\\"children\\\":[[\\\"$\\\",\\\"svg\\\",null,{\\\"viewBox\\\":\\\"0 0 24 24\\\",\\\"fill\\\":\\\"none\\\",\\\"stroke\\\":\\\"currentColor\\\",\\\"strokeWidth\\\":\\\"2.5\\\",\\\"strokeLinecap\\\":\\\"round\\\",\\\"className\\\":\\\"w-4 h-4\\\",\\\"children\\\":[[\\\"$\\\",\\\"line\\\",null,{\\\"x1\\\":\\\"12\\\",\\\"y1\\\":\\\"5\\\",\\\"x2\\\":\\\"12\\\",\\\"y2\\\":\\\"19\\\"}],[\\\"$\\\",\\\"line\\\",null,{\\\"x1\\\":\\\"5\\\",\\\"y1\\\":\\\"12\\\",\\\"x2\\\":\\\"19\\\",\\\"y2\\\":\\\"12\\\"}]]}],\\\"New Return\\\"]}]]}]]}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"max-w-[1200px] mx-auto w-full px-8 py-7\\\",\\\"children\\\":[\\\"$\\\",\\\"$L1a\\\",null,{\\\"cases\\\":[{\\\"id\\\":\\\"f5f70ba6-e646-4ab9-8aa7-7fbe218ca110\\\",\\\"case_number\\\":\\\"CASE-202604-0056\\\",\\\"customer_id\\\":\\\"36fe525e-6813-42d0-9efe-dd1c7d252bdb\\\",\\\"office\\\":\\\"UK\\\",\\\"status\\\":\\\"IN_REPAIR\\\",\\\"fault_type\\\":\\\"repair\\\",\\\"fault_description\\\":\\\"End of season service. CDU display brightness degraded and ECU comms intermittent.\\\",\\\"fault_display_info\\\":false,\\\"fault_display_details\\\":null,\\\"tested_on_other_unit\\\":false,\\\"fault_follows\\\":null,\\\"required_return_date\\\":\\\"2026-05-10\\\",\\\"shipping_address\\\":null,\\\"rma_number\\\":\\\"RMA-202604-0055\\\",\\\"sap_repair_order\\\":null,\\\"sap_sales_order\\\":\\\"9010457\\\",\\\"sap_works_order\\\":\\\"REP-2026-05601\\\",\\\"sap_booked_in_date\\\":null,\\\"sap_estimated_completion\\\":\\\"2026-04-20\\\",\\\"sap_order_value\\\":310,\\\"sap_spent_hours\\\":3,\\\"sap_days_open\\\":null,\\\"last_import_at\\\":null,\\\"workshop_stage\\\":\\\"REWORK\\\",\\\"is_on_hold\\\":false,\\\"hold_reason\\\":null,\\\"hold_customer_label\\\":null,\\\"awaiting_customer_question\\\":null,\\\"payment_required\\\":false,\\\"payment_status\\\":\\\"waived\\\",\\\"stripe_payment_intent_id\\\":null,\\\"po_number\\\":null,\\\"assigned_to\\\":null,\\\"parent_case_id\\\":null,\\\"is_internal_transfer\\\":false,\\\"internal_po\\\":null,\\\"created_at\\\":\\\"2026-04-10T21:26:30.699671+00:00\\\",\\\"updated_at\\\":\\\"2026-04-10T21:32:21.174731+00:00\\\",\\\"closed_at\\\":null,\\\"case_products\\\":[{\\\"products\\\":{\\\"variant\\\":null,\\\"display_name\\\":\\\"CDU 7.0\\\"},\\\"product_id\\\":\\\"49c3d634-f1b1-4247-ab1b-7cfd9f2c320e\\\"},{\\\"products\\\":{\\\"variant\\\":null,\\\"display_name\\\":\\\"SQ6M ECU\\\"},\\\"product_id\\\":\\\"23898899-4704-4f28-91a0-e17050d361cd\\\"}],\\\"product_name\\\":\\\"CDU 7.0\\\"},{\\\"id\\\":\\\"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb\\\",\\\"case_number\\\":\\\"CASE-202604-0051\\\",\\\"customer_id\\\":\\\"36fe525e-6813-42d0-9efe-dd1c7d252bdb\\\",\\\"office\\\":\\\"UK\\\",\\\"status\\\":\\\"SUBMITTED\\\",\\\"fault_type\\\":\\\"repair\\\",\\\"fault_description\\\":\\\"Unit not powering on after impact. No response on CAN bus.\\\",\\\"fault_display_info\\\":false,\\\"fault_display_details\\\":null,\\\"tested_on_other_unit\\\":false,\\\"fault_follows\\\":null,\\\"required_return_date\\\":\\\"2026-06-06\\\",\\\"shipping_address\\\":null,\\\"rma_number\\\":null,\\\"sap_repair_order\\\":null,\\\"sap_sales_order\\\":null,\\\"sap_works_order\\\":null,\\\"sap_booked_in_date\\\":null,\\\"sap_estimated_completion\\\":null,\\\"sap_order_value\\\":null,\\\"sap_spent_hours\\\":null,\\\"sap_days_open\\\":null,\\\"last_import_at\\\":null,\\\"workshop_stage\\\":null,\\\"is_on_hold\\\":false,\\\"hold_reason\\\":null,\\\"hold_customer_label\\\":null,\\\"awaiting_customer_question\\\":null,\\\"payment_required\\\":false,\\\"payment_status\\\":\\\"pending\\\",\\\"stripe_payment_intent_id\\\":null,\\\"po_number\\\":null,\\\"assigned_to\\\":null,\\\"parent_case_id\\\":null,\\\"is_internal_transfer\\\":false,\\\"internal_po\\\":null,\\\"created_at\\\":\\\"2026-04-07T10:08:09.940815+00:00\\\",\\\"updated_at\\\":\\\"2026-04-07T10:08:09.940815+00:00\\\",\\\"closed_at\\\":null,\\\"case_products\\\":[{\\\"products\\\":{\\\"variant\\\":null,\\\"display_name\\\":\\\"Antares 8 TLA\\\"},\\\"product_id\\\":\\\"29cbd8e6-7736-4dba-a028-8f31b23e22ff\\\"},{\\\"products\\\":{\\\"variant\\\":null,\\\"display_name\\\":\\\"Antares 8 TLA\\\"},\\\"product_id\\\":\\\"29cbd8e6-7736-4dba-a028-8f31b23e22ff\\\"},{\\\"products\\\":{\\\"variant\\\":null,\\\"display_name\\\":\\\"Antares 8 TLA\\\"},\\\"product_id\\\":\\\"29cbd8e6-7736-4dba-a028-8f31b23e22ff\\\"},{\\\"products\\\":{\\\"variant\\\":null,\\\"display_name\\\":\\\"Antares 8 TLA\\\"},\\\"product_id\\\":\\\"29cbd8e6-7736-4dba-a028-8f31b23e22ff\\\"}],\\\"product_name\\\":\\\"Antares 8 TLA\\\"},{\\\"id\\\":\\\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\\\",\\\"case_number\\\":\\\"CASE-202604-0047\\\",\\\"customer_id\\\":\\\"36fe525e-6813-42d0-9efe-dd1c7d252bdb\\\",\\\"office\\\":\\\"UK\\\",\\\"status\\\":\\\"IN_REPAIR\\\",\\\"fault_type\\\":\\\"repair\\\",\\\"fault_description\\\":\\\"Unit powering on intermittently. Display flickering and losing comms with ECU during high vibration.\\\",\\\"fault_display_info\\\":false,\\\"fault_display_details\\\":null,\\\"tested_on_other_unit\\\":false,\\\"fault_follows\\\":null,\\\"required_return_date\\\":\\\"2026-05-22\\\",\\\"shipping_address\\\":null,\\\"rma_number\\\":\\\"RMA-202604-0047\\\",\\\"sap_repair_order\\\":\\\"REP-2026-04471\\\",\\\"sap_sales_order\\\":\\\"9010540\\\",\\\"sap_works_order\\\":\\\"4015260\\\",\\\"sap_booked_in_date\\\":null,\\\"sap_estimated_completion\\\":\\\"2026-04-21\\\",\\\"sap_order_value\\\":340,\\\"sap_spent_hours\\\":2.5,\\\"sap_days_open\\\":10,\\\"last_import_at\\\":null,\\\"workshop_stage\\\":\\\"FINAL_TEST\\\",\\\"is_on_hold\\\":false,\\\"hold_reason\\\":null,\\\"hold_customer_label\\\":null,\\\"awaiting_customer_question\\\":null,\\\"payment_required\\\":false,\\\"payment_status\\\":\\\"waived\\\",\\\"stripe_payment_intent_id\\\":null,\\\"po_number\\\":\\\"BT-2026-0441\\\",\\\"assigned_to\\\":null,\\\"parent_case_id\\\":null,\\\"is_internal_transfer\\\":false,\\\"internal_po\\\":null,\\\"created_at\\\":\\\"2026-04-07T10:08:09.940815+00:00\\\",\\\"updated_at\\\":\\\"2026-04-10T06:58:46.053895+00:00\\\",\\\"closed_at\\\":null,\\\"case_products\\\":[{\\\"products\\\":{\\\"variant\\\":null,\\\"display_name\\\":\\\"CDU 10.3\\\"},\\\"product_id\\\":\\\"616f00e0-ad5d-4459-84fc-79ecb0bf84fd\\\"},{\\\"products\\\":{\\\"variant\\\":null,\\\"display_name\\\":\\\"CDU 10.3\\\"},\\\"product_id\\\":\\\"616f00e0-ad5d-4459-84fc-79ecb0bf84fd\\\"},{\\\"products\\\":{\\\"variant\\\":null,\\\"display_name\\\":\\\"CDU 10.3\\\"},\\\"product_id\\\":\\\"616f00e0-ad5d-4459-84fc-79ecb0bf84fd\\\"},{\\\"products\\\":{\\\"variant\\\":null,\\\"display_name\\\":\\\"CDU 10.3\\\"},\\\"product_id\\\":\\\"616f00e0-ad5d-4459-84fc-79ecb0bf84fd\\\"}],\\\"product_name\\\":\\\"CDU 10.3\\\"}]}]}]]\\n\"])$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};$RS(\"S:1\",\"P:1\")$RB=[];$RV=function(a){$RT=performance.now();for(var b=0;b<a.length;b+=2){var c=a[b],e=a[b+1];null!==e.parentNode&&e.parentNode.removeChild(e);var f=c.parentNode;if(f){var g=c.previousSibling,h=0;do{if(c&&8===c.nodeType){var d=c.data;if(\"/$\"===d||\"/&\"===d)if(0===h)break;else h--;else\"$\"!==d&&\"$?\"!==d&&\"$~\"!==d&&\"$!\"!==d&&\"&\"!==d||h++}d=c.nextSibling;f.removeChild(c);c=d}while(c);for(;e.firstChild;)f.insertBefore(e.firstChild,c);g.data=\"$\";g._reactRetry&&requestAnimationFrame(g._reactRetry)}}a.length=0};
$RC=function(a,b){if(b=document.getElementById(b))(a=document.getElementById(a))?(a.previousSibling.data=\"$~\",$RB.push(a,b),2===$RB.length&&(\"number\"!==typeof $RT?requestAnimationFrame($RV.bind(null,$RB)):(a=performance.now(),setTimeout($RV.bind(null,$RB),2300>a&&2E3<a?2300-a:$RT+300-a)))):b.parentNode.removeChild(b)};$RC(\"B:0\",\"S:0\")"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "Cosworth Returns" [ref=e4] [cursor=pointer]:
        - /url: /
        - img [ref=e6]
        - generic [ref=e10]: Cosworth Returns
      - navigation "Primary navigation" [ref=e11]:
        - button "WK Will Kerridge Customer" [ref=e13]:
          - generic [ref=e14]: WK
          - generic [ref=e15]:
            - generic [ref=e16]: Will Kerridge
            - generic [ref=e17]: Customer
          - img [ref=e18]
  - main [ref=e20]:
    - generic [ref=e23]:
      - generic [ref=e24]:
        - generic [ref=e25]:
          - text: Home
          - img [ref=e26]
          - generic [ref=e28]: My Returns
        - heading "My Returns" [level=1] [ref=e29]
        - paragraph [ref=e30]: Track your cases and manage your returns with Cosworth Electronics.
      - link "New Return" [ref=e31] [cursor=pointer]:
        - /url: /submit
        - img [ref=e32]
        - text: New Return
    - generic [ref=e34]:
      - generic [ref=e35]:
        - button "All 3" [ref=e36]:
          - text: All
          - generic [ref=e37]: "3"
        - button "Open 3" [ref=e38]:
          - text: Open
          - generic [ref=e39]: "3"
        - button "On Hold" [ref=e40]
        - button "Closed" [ref=e41]
      - generic [ref=e42]:
        - link "CASE-202604-0056RMA-202604-0055 In Repair CDU 7.0 Repair · Required by 10 May 2026 Submitted RMA Issued Received In Rework QC Returned Submitted 10 Apr 2026 View Details →" [ref=e43] [cursor=pointer]:
          - /url: /cases/f5f70ba6-e646-4ab9-8aa7-7fbe218ca110
          - generic [ref=e44]:
            - generic [ref=e45]:
              - generic [ref=e46]: CASE-202604-0056RMA-202604-0055
              - generic [ref=e48]: In Repair
            - generic [ref=e50]:
              - generic [ref=e51]: CDU 7.0
              - generic [ref=e52]: Repair · Required by 10 May 2026
            - generic [ref=e53]:
              - generic [ref=e55]:
                - img [ref=e57]
                - generic [ref=e59]: Submitted
              - generic [ref=e62]:
                - img [ref=e64]
                - generic [ref=e66]: RMA Issued
              - generic [ref=e69]:
                - img [ref=e71]
                - generic [ref=e73]: Received
              - generic [ref=e78]: In Rework
              - generic [ref=e83]: QC
              - generic [ref=e88]: Returned
            - generic [ref=e89]:
              - generic [ref=e90]: Submitted 10 Apr 2026
              - generic [ref=e91]: View Details →
        - link "CASE-202604-0051 Submitted Antares 8 TLA Repair · Required by 6 Jun 2026 Submitted RMA Issued Received In Repair QC Returned Submitted 7 Apr 2026 View Details →" [ref=e92] [cursor=pointer]:
          - /url: /cases/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
          - generic [ref=e93]:
            - generic [ref=e94]:
              - generic [ref=e95]: CASE-202604-0051
              - generic [ref=e97]: Submitted
            - generic [ref=e99]:
              - generic [ref=e100]: Antares 8 TLA
              - generic [ref=e101]: Repair · Required by 6 Jun 2026
            - generic [ref=e102]:
              - generic [ref=e106]: Submitted
              - generic [ref=e111]: RMA Issued
              - generic [ref=e116]: Received
              - generic [ref=e121]: In Repair
              - generic [ref=e126]: QC
              - generic [ref=e131]: Returned
            - generic [ref=e132]:
              - generic [ref=e133]: Submitted 7 Apr 2026
              - generic [ref=e134]: View Details →
        - link "CASE-202604-0047RMA-202604-0047 In Repair CDU 10.3 Repair · Required by 22 May 2026 Submitted RMA Issued Received Final Test QC Returned Submitted 7 Apr 2026 View Details →" [ref=e135] [cursor=pointer]:
          - /url: /cases/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
          - generic [ref=e136]:
            - generic [ref=e137]:
              - generic [ref=e138]: CASE-202604-0047RMA-202604-0047
              - generic [ref=e140]: In Repair
            - generic [ref=e142]:
              - generic [ref=e143]: CDU 10.3
              - generic [ref=e144]: Repair · Required by 22 May 2026
            - generic [ref=e145]:
              - generic [ref=e147]:
                - img [ref=e149]
                - generic [ref=e151]: Submitted
              - generic [ref=e154]:
                - img [ref=e156]
                - generic [ref=e158]: RMA Issued
              - generic [ref=e161]:
                - img [ref=e163]
                - generic [ref=e165]: Received
              - generic [ref=e170]: Final Test
              - generic [ref=e175]: QC
              - generic [ref=e180]: Returned
            - generic [ref=e181]:
              - generic [ref=e182]: Submitted 7 Apr 2026
              - generic [ref=e183]: View Details →
  - contentinfo [ref=e184]:
    - generic [ref=e185]:
      - generic [ref=e186]:
        - generic [ref=e187]:
          - paragraph [ref=e188]: Cosworth Electronics Ltd
          - generic [ref=e189]:
            - text: Brookfield Technology Centre
            - text: Twentypence Road, Cottenham
            - text: Cambridge, CB24 8PS
            - text: United Kingdom
        - generic [ref=e190]:
          - paragraph [ref=e191]: Cosworth Electronics LLC
          - generic [ref=e192]:
            - text: 5355 W 86th St
            - text: Indianapolis, IN 46268
            - text: United States
      - generic [ref=e193]:
        - paragraph [ref=e194]: COSWORTH® is a registered trade mark of Cosworth Group Holdings Limited
        - generic [ref=e195]:
          - link "Legal Policies" [ref=e196] [cursor=pointer]:
            - /url: "#"
          - link "User Guides" [ref=e197] [cursor=pointer]:
            - /url: "#"
  - alert [ref=e198]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'
  4  | 
  5  | // This test file runs in the chromium-customer project — pre-authenticated as demo.customer@btsport.com
  6  | 
  7  | test.describe('Customer case list', () => {
  8  |   test('customer can see their cases page after login', async ({ page }) => {
  9  |     await page.goto(`${BASE}/cases`)
  10 |     await expect(page).not.toHaveURL(/\/login/)
  11 |     await expect(page.locator('main')).toBeVisible()
  12 |   })
  13 | 
  14 |   test('CREDIT_HELD label is never visible to customer', async ({ page }) => {
  15 |     await page.goto(`${BASE}/cases`)
  16 |     const pageText = await page.locator('body').textContent()
  17 |     expect(pageText?.toLowerCase()).not.toContain('credit held')
  18 |     expect(pageText).not.toContain('CREDIT_HELD')
  19 |   })
  20 | 
  21 |   test('SAP financial data is not visible to customer', async ({ page }) => {
  22 |     await page.goto(`${BASE}/cases`)
  23 |     const pageText = await page.locator('body').textContent()
> 24 |     expect(pageText).not.toContain('sap_order_value')
     |                          ^ Error: expect(received).not.toContain(expected) // indexOf
  25 |     expect(pageText).not.toContain('sap_spent_hours')
  26 |   })
  27 | 
  28 |   test('customer nav shows "Customer" role label', async ({ page }) => {
  29 |     await page.goto(`${BASE}/cases`)
  30 |     await expect(page.locator('text=Customer')).toBeVisible({ timeout: 8000 })
  31 |   })
  32 | })
  33 | 
  34 | test.describe('Customer case isolation', () => {
  35 |   test('customer cannot access admin case detail', async ({ page }) => {
  36 |     await page.goto(`${BASE}/admin/cases`)
  37 |     expect(page.url()).not.toContain('/admin/cases')
  38 |   })
  39 | })
  40 | 
```