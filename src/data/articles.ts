export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
  readTime?: string;
  body: string;
}

export const articles: Article[] = [
  {
    id: "7",
    title: "Is Australian Tap Water Getting Worse? What the Data Actually Says",
    slug: "is-australian-tap-water-getting-worse",
    summary: "An evidence-based look at chlorine levels, algal blooms, bushfire impacts, and PFAS — and what it means for your household.",
    category: "Water Quality",
    seoTitle: "Is Australian Tap Water Getting Worse? What the Data Says (2026)",
    seoDescription: "Evidence-based analysis of Australian tap water quality trends — chlorine, algal blooms, PFAS, and bushfire impacts. What the data means for your home.",
    publishedAt: "2026-04-02",
    readTime: "8 min read",
    body: `Australian tap water is safe to drink. No serious scientist or health authority disputes that. But "safe" and "pleasant" are two very different things — and an honest look at the data shows that the taste, smell, and aesthetic quality of Australian tap water has been declining in measurable ways.

Here is what the evidence actually shows.

**Chlorine: Why Your Water Tastes More Like a Swimming Pool**

Chlorine has been added to Australian tap water for over a century to kill bacteria and keep water safe as it travels through distribution networks. That's not changing.

What is changing is how much chlorine needs to be added — and why.

Australian cities are growing. Pipe networks are getting longer. As water travels further from treatment plants to reach new outer suburbs, more chlorine is needed to maintain safe levels at the end of the line. On top of that, Australia's summers are getting hotter. Heat accelerates bacterial growth in pipes, which means utilities must dose more chlorine at the source to compensate.

The practical result: many Australians living in outer suburbs or at the end of long distribution networks are receiving water with chlorine levels above the 0.6 mg/L taste and smell threshold — the point at which most people start to notice a chemical taste or odour.

Greater Western Water, which supplies Melbourne's north and west, has confirmed chlorine levels up to 1.2 mg/L in parts of its network. SA Water has recorded levels approaching 1.8 mg/L in northern Adelaide suburbs. While both figures remain within the Australian Drinking Water Guidelines (ADWG) health limit of 5 mg/L, they are significantly above what most people find palatable.

For context: the average backyard swimming pool is maintained at 1.0 to 3.0 mg/L. Many Australians are showering and drinking water that isn't below pool levels.

Making matters worse, an increasing number of utilities are transitioning from chlorine to chloramine — a compound formed by adding ammonia to chlorine. Chloramine is more stable than chlorine, meaning it maintains disinfection protection over longer pipe distances without breaking down. For water authorities, this is an advantage. For consumers, it creates a new problem: chloramine is significantly harder to remove from water than free chlorine. Standard jug filters and cheap tap-mounted units have little effect on it. Only quality activated carbon block filters can adequately reduce chloramine.

**Algal Blooms: The Hidden Threat Getting Worse Every Summer**

If you've noticed your Brisbane tap water tasting earthy or grassy after heavy rain, you're not imagining it. Seqwater issued a public notice in late 2024 confirming exactly this problem — and explaining that it's becoming a recurring issue.

The culprit is a pair of naturally occurring organic compounds called MIB (2-methylisoborneol) and geosmin, both produced by algae and bacteria that bloom in dam catchments after hot and wet conditions. The compounds are harmless but detectable by the human nose at extraordinarily low concentrations — around 0.00001 mg/L for geosmin. A single teaspoon dissolved across 200 Olympic swimming pools would be enough for sensitive individuals to smell it.

When algal levels spike in source water, treatment plants work to remove MIB and geosmin using powdered activated carbon. But as Seqwater has publicly acknowledged, the process can't always remove all of it — and some makes it through to taps.

This is not a Queensland-only problem. The Australian Government's State of the Environment report, the most comprehensive assessment of Australia's environmental health, confirmed that algal bloom frequency across the country is increasing. The report directly links this trend to climate change: warmer temperatures, changed rainfall patterns, and more extreme wet-dry cycles create ideal conditions for algal growth.

The peer-reviewed journal Communications Earth & Environment published research in March 2025 confirming that water quality in rivers flowing into the Great Barrier Reef region has declined measurably over two decades, with climate change identified as the primary driver.

South Australia's 2025 algal event brought the issue into stark national focus. A toxic algal bloom — driven by a marine heatwave that raised ocean temperatures 2.5°C above normal — devastated more than 4,500 square kilometres of the state's waters, killing thousands of marine animals and forcing the closure of shellfish harvesting regions. The Biodiversity Council called it "one of the worst marine disasters in living memory."

The NSW State of the Environment 2024 report was similarly direct, stating that "decreased rainfall can lead to poorer water quality or increases in blooms of blue-green algae."

**Bushfires: How the 2019-20 Fires Changed Australia's Water Forever**

The Black Summer fires of 2019-20 burned more than 170,000 square kilometres of Australia. For most people, the story ended when the fires were extinguished. For water quality scientists, it was just beginning.

The fires burned 30% of Warragamba Dam's entire catchment area — Sydney's primary water supply. They burned 39% of the Corin Dam catchment that supplies Canberra. They burned 57% of the Hume Dam catchment in the southern Murray-Darling Basin.

The Australian Government's own environment report documented the consequences in detail: ash-enriched soils washed into reservoirs during rainfall events, significantly increasing turbidity and nutrient loads. This elevated nutrient load creates ideal conditions for algal blooms — the same compounds that create taste and odour problems in treated water. The effects are expected to persist for years as burned catchments slowly revegetate.

The 2019-20 fires also triggered a catastrophic hypoxic blackwater event in the Murray-Darling Basin, with rotten egg odours from hydrogen sulfide reported as far as Albury. Albury City Council formally reported water quality supply issues to authorities.

This is not an isolated historical event. Bushfire scientists warn that as Australia's climate warms, fires of this scale and intensity will occur more frequently. Each major fire season in a water catchment creates a multi-year legacy of elevated turbidity, algal growth potential, and treatment challenges.

**PFAS: The Forever Chemicals Now in Our Water Supply**

Per- and polyfluoroalkyl substances — PFAS, commonly called "forever chemicals" — do not occur naturally in water. They enter water supplies from industrial activity, firefighting foams used at airports and military bases, and widespread use in consumer products.

In 2024, elevated PFAS levels were detected at Sydney's Cascade Water Filtration Plant, which serves the Blue Mountains region. The announcement prompted concern among residents and water quality advocates. NSW Health and Sydney Water confirmed that levels remained within the then-current Australian Drinking Water Guidelines.

The critical word is "then-current." In June 2025, the National Health and Medical Research Council released updated Australian Drinking Water Guidelines that set significantly lower PFAS limits — acknowledging that earlier standards were insufficient given emerging health research. The update was a formal recognition by Australia's peak health body that PFAS in drinking water is a real and growing concern.

The challenge with PFAS is that they are effectively invisible and tasteless. You cannot detect them by smelling your water or observing its colour. They are only identified through laboratory testing. And crucially, carbon filters — the most common household filtration technology — have limited effectiveness against PFAS. Only reverse osmosis systems reliably remove them.

Monitoring for PFAS in Australian water supplies has only expanded relatively recently. Greater Western Water confirmed it began PFAS testing in 2023. The fact that more monitoring is now occurring is encouraging — but it also means that elevated readings, which would previously have gone undetected, are now being identified and reported.

**What the Data Means for Your Household**

Australian tap water will not make you sick. The system of treatment, monitoring, and regulation that protects public health is robust and well-resourced.

But the evidence is clear that the aesthetic quality of tap water — its taste, smell, and freedom from emerging contaminants — is under genuine and increasing pressure from climate change, population growth, and the expanding use of treatment chemicals.

The specific risks vary significantly by location:

- **Adelaide** faces the most significant challenges of any Australian capital — the hardest water, the highest chlorine levels, and a Murray River source that carries agricultural runoff and elevated mineral content. Northern suburbs around Salisbury and Elizabeth receive water that regularly exceeds the taste threshold for chlorine.
- **Perth** has the most variable water quality of any Australian capital. Northern suburbs like Wanneroo, Yanchep, and Two Rocks receive groundwater with hardness levels up to 228 mg/L — among the highest in the country. Scale damage to appliances, shower screens, and hot water systems is a significant and ongoing cost for households in these areas.
- **Brisbane and South East Queensland** experience seasonal taste and odour events driven by algal blooms in Wivenhoe and North Pine dams. These events are expected to become more frequent as summers grow hotter and wetter. The water remains safe, but the taste complaints are legitimate.
- **Melbourne** has some of the softest and cleanest water of any Australian city — but chlorine levels are notably higher than many people realise, and skin irritation from chlorine in shower water is a genuine and commonly reported issue.
- **Sydney** has soft, well-treated water, but uses both chlorine and chloramine for disinfection. The Blue Mountains PFAS detection in 2024 serves as a reminder that no water supply is entirely insulated from contamination risks.

**What Actually Works**

Given the specific nature of the issues — chlorine taste and skin irritation, algal compounds, hard water scale, and PFAS — different filtration solutions address different problems:

- **For chlorine taste, smell, and skin irritation:** A quality under-sink carbon block filter for drinking water, or a whole house carbon filtration system for whole-home chlorine removal including showers. This is the most common and cost-effective upgrade for Australian households.
- **For hard water and scale:** A water softener (for severe hardness in Perth northern suburbs and parts of Adelaide) or a whole house system with a scale-reduction stage (for moderate hardness in Brisbane, Adelaide, and parts of Perth).
- **For fluoride, PFAS, heavy metals, and microplastics:** A reverse osmosis system. Carbon filters reduce but do not eliminate these contaminants. RO is the only household technology that effectively removes PFAS.
- **For bore water, rainwater, and tank water:** A sediment pre-filter combined with UV disinfection is the essential starting point. Adding an under-sink carbon or RO system for drinking water provides additional protection.

**The Bottom Line**

The question isn't whether Australian tap water is safe — it is. The question is whether it's as good as it was, and whether it's going to get better or worse.

The data points in one direction. Hotter summers, more frequent algal blooms, longer distribution networks, expanded chloramine use, and emerging contaminants like PFAS are all placing increasing pressure on the quality of water that reaches Australian taps.

For households that are already noticing taste, smell, or skin concerns from their tap water — the trend is not in their favour.

The good news is that effective solutions exist for every situation and budget. The first step is understanding what's actually in your water and what it means for your home.

**Sources:**

- Melbourne Water Annual Drinking Water Quality Report 2024–25
- Sydney Water Quarterly Drinking Water Quality Reports 2024–25
- Water Corporation WA Drinking Water Quality Annual Report 2023–24
- Seqwater QLD Monthly Water Quality Reports 2024–25
- SA Water Annual Drinking Water Quality Report 2023–24
- Greater Western Water Annual Drinking Water Quality Report 2024
- Australian Government State of the Environment Report 2021 — Inland Water
- NSW State of the Environment 2024 — Climate Change
- Communications Earth & Environment: "Australian water quality trends over two decades" (March 2025)
- Bureau of Meteorology: Tracking Australia's climate and water resources through 2025
- NHMRC: Australian Drinking Water Guidelines updated June 2025
- Biodiversity Council: South Australian algal bloom assessment 2025`,
  },
  {
    id: "1",
    title: "Do I Need Reverse Osmosis or Whole House Filtration?",
    slug: "reverse-osmosis-vs-whole-house",
    summary: "Understanding the difference between RO and whole house systems, and when you might need both.",
    category: "Guides",
    seoTitle: "Reverse Osmosis vs Whole House Filtration — Which Do You Need?",
    seoDescription: "Compare reverse osmosis and whole house water filtration systems. Learn which suits your home, budget, and water concerns in Australia.",
    publishedAt: "2024-11-15",
    body: "If you're researching water filtration, you've likely come across two popular options: reverse osmosis (RO) and whole house filtration. While both improve your water quality, they serve very different purposes.\n\n**Whole house filtration** is installed at the point of entry to your home. It filters all the water coming into your property — every tap, every shower, every appliance. It's great for removing chlorine, sediment, and improving general water quality throughout the home.\n\n**Reverse osmosis** is typically installed under your kitchen sink and provides ultra-pure drinking water from a dedicated tap. It removes up to 99% of contaminants, including fluoride, heavy metals, and dissolved solids.\n\n**So which do you need?** It depends on your priorities. If you're mainly concerned about drinking water purity, an RO system may be enough. If you want better water everywhere — showers, laundry, appliances — a whole house system is the way to go. Many Australian households choose both: whole house for general quality, plus RO at the kitchen for the best drinking water.",
  },
  {
    id: "2",
    title: "Does Carbon Remove Fluoride?",
    slug: "does-carbon-remove-fluoride",
    summary: "A common question with an important answer. Here's what carbon filters can and can't do.",
    category: "FAQs",
    seoTitle: "Does Carbon Filtration Remove Fluoride? — Water Filter Facts",
    seoDescription: "Learn whether carbon water filters remove fluoride, and what type of system you need for effective fluoride removal in Australia.",
    publishedAt: "2024-10-28",
    body: "This is one of the most common questions we hear, and the answer matters: **standard carbon filters do not effectively remove fluoride**.\n\nActivated carbon is excellent at removing chlorine, improving taste, reducing sediment, and capturing some organic compounds. However, fluoride is a dissolved mineral that passes through standard carbon media.\n\nTo effectively remove fluoride from your drinking water, you'll need either:\n\n- **Reverse osmosis (RO)** — the most effective household method, removing 90–99% of fluoride\n- **Activated alumina filters** — a specialised media designed for fluoride removal\n- **Bone char filters** — less common but effective\n\nIf fluoride removal is important to you, make sure any system you're considering specifically lists fluoride removal in its certifications or test results. Don't assume a carbon filter handles it — always check.",
  },
  {
    id: "3",
    title: "What Does a Water Softener Actually Do?",
    slug: "what-does-a-water-softener-do",
    summary: "Water softeners are popular but widely misunderstood. Here's what they actually do — and don't do.",
    category: "Guides",
    seoTitle: "What Does a Water Softener Do? — Australian Guide",
    seoDescription: "Understand how water softeners work, what hard water is, and whether you need a softener for your Australian home.",
    publishedAt: "2024-10-10",
    body: "A water softener removes calcium and magnesium minerals from your water supply through a process called ion exchange. These minerals are what make water \"hard\" and cause the white scale buildup you see on taps, shower screens, and inside kettles.\n\n**What a softener does well:**\n- Prevents scale buildup in pipes and on fixtures\n- Extends the life of hot water systems and appliances\n- Makes soap and shampoo lather better\n- Reduces water spotting on glass\n\n**What a softener does NOT do:**\n- It does not filter or purify your water\n- It does not remove chlorine, fluoride, or heavy metals\n- It does not improve drinking water taste\n\nThink of it this way: a softener treats the minerals, while a filter treats the contaminants. Many households in hard water areas (common in parts of SA, QLD, and WA) benefit from both — a softener for the whole house and a separate drinking water filter at the kitchen.",
  },
  {
    id: "4",
    title: "Why Are Some Water Filter Systems So Expensive?",
    slug: "why-water-filters-expensive",
    summary: "Understanding what drives the cost of water filtration — and what you're actually paying for.",
    category: "Pricing",
    seoTitle: "Why Are Water Filters Expensive? — Pricing Explained",
    seoDescription: "Understand why water filtration systems vary so much in price, from $300 to $8,000+. What drives the cost and what you get for your money.",
    publishedAt: "2024-09-22",
    body: "If you've ever searched for water filter quotes, you've probably been confused by the range. A simple under-sink filter might be $300–$500, while a whole house system can be $3,000–$8,000+. Why the huge difference?\n\n**Key factors that affect price:**\n\n1. **System type** — Reverse osmosis and whole house systems use more complex technology than a basic carbon filter\n2. **Installation complexity** — Whole house systems require plumbing modifications by a licensed plumber\n3. **Filtration stages** — More stages generally means more thorough filtration but higher cost\n4. **Certifications** — Systems tested and certified to Australian standards (like WaterMark) cost more to produce\n5. **Brand and warranty** — Premium brands with longer warranties and local support charge more\n6. **Ongoing costs** — Some cheaper systems have expensive replacement filters, making them more costly long-term\n\n**What you should know:** The cheapest option isn't always the best value. A mid-range system with good warranty, local support, and reasonable filter costs often provides the best balance of quality and affordability.",
  },
  {
    id: "5",
    title: "Best Water Filter Option for Melbourne Homes",
    slug: "best-water-filter-melbourne",
    summary: "Melbourne's water is generally high quality, but there are still good reasons to filter. Here's what works best.",
    category: "Location Guides",
    seoTitle: "Best Water Filter for Melbourne — 2024 Guide",
    seoDescription: "Find the best water filtration system for Melbourne homes. Understand Melbourne's water quality and which filter type suits your needs.",
    publishedAt: "2024-09-05",
    body: "Melbourne is known for having some of the best tap water in Australia, sourced primarily from protected mountain catchments. However, that doesn't mean filtration is unnecessary.\n\n**Why filter Melbourne water?**\n- Chlorine is added for disinfection and can affect taste\n- Older homes may have lead or copper plumbing\n- Some residents prefer to remove fluoride\n- Sediment can occasionally appear after maintenance works\n\n**Best options for Melbourne homes:**\n\n- **For taste improvement:** A quality under-sink carbon filter ($300–$800 installed) will handle chlorine and sediment effectively\n- **For fluoride removal:** A reverse osmosis system ($800–$1,500 installed) is the most practical option\n- **For whole home quality:** A whole house carbon filter ($2,500–$5,000 installed) removes chlorine from every tap and shower\n- **For complete coverage:** A whole house filter + under-sink RO combo ($4,000–$6,000 installed) gives you the best of both worlds\n\nMelbourne's water quality means you don't need the most aggressive filtration — a well-matched system will do the job without overspending.",
  },
  {
    id: "6",
    title: "Questions to Ask Before Buying a Water Filter",
    slug: "questions-before-buying",
    summary: "Don't buy a water filter until you can answer these key questions. A quick checklist to make a smarter choice.",
    category: "Guides",
    seoTitle: "Questions to Ask Before Buying a Water Filter — Checklist",
    seoDescription: "Essential questions to ask before purchasing a water filtration system. Avoid common mistakes and choose the right filter for your Australian home.",
    publishedAt: "2024-08-18",
    body: "Before you commit to a water filtration system, make sure you can answer these questions:\n\n1. **What's your water source?** Town water, rainwater, bore water, and tank water all have different filtration needs.\n\n2. **What are you trying to remove?** Chlorine taste? Fluoride? Heavy metals? Hard water minerals? The answer determines the system type.\n\n3. **Do you want filtered water at one tap, or throughout the whole house?** This is the biggest factor in system selection and cost.\n\n4. **What's your budget — including ongoing costs?** A cheaper system with expensive replacement filters may cost more in the long run.\n\n5. **Is the system certified?** Look for WaterMark certification and independent testing results.\n\n6. **What's the warranty and who supports it?** Local support and servicing is important — especially for whole house systems.\n\n7. **Who will install it?** Under-sink systems can sometimes be DIY, but whole house systems need a licensed plumber.\n\n8. **How often do filters need replacing?** And how much do replacement filters cost?\n\nAnswering these questions will help you avoid overspending or buying a system that doesn't actually solve your problem.",
  },
  {
    id: "7",
    title: "Is Australian Tap Water Getting Worse? What the Data Actually Says",
    slug: "is-australian-tap-water-getting-worse",
    summary: "An evidence-based look at chlorine levels, algal blooms, bushfire impacts, and PFAS — and what it means for your household.",
    category: "Water Quality",
    seoTitle: "Is Australian Tap Water Getting Worse? What the Data Says (2026)",
    seoDescription: "Evidence-based analysis of Australian tap water quality trends — chlorine, algal blooms, PFAS, and bushfire impacts. What the data means for your home.",
    publishedAt: "2026-04-02",
    readTime: "8 min read",
    body: `Australian tap water is safe to drink. No serious scientist or health authority disputes that. But "safe" and "pleasant" are two very different things — and an honest look at the data shows that the taste, smell, and aesthetic quality of Australian tap water has been declining in measurable ways.

Here is what the evidence actually shows.

**Chlorine: Why Your Water Tastes More Like a Swimming Pool**

Chlorine has been added to Australian tap water for over a century to kill bacteria and keep water safe as it travels through distribution networks. That's not changing.

What is changing is how much chlorine needs to be added — and why.

Australian cities are growing. Pipe networks are getting longer. As water travels further from treatment plants to reach new outer suburbs, more chlorine is needed to maintain safe levels at the end of the line. On top of that, Australia's summers are getting hotter. Heat accelerates bacterial growth in pipes, which means utilities must dose more chlorine at the source to compensate.

The practical result: many Australians living in outer suburbs or at the end of long distribution networks are receiving water with chlorine levels above the 0.6 mg/L taste and smell threshold — the point at which most people start to notice a chemical taste or odour.

Greater Western Water, which supplies Melbourne's north and west, has confirmed chlorine levels up to 1.2 mg/L in parts of its network. SA Water has recorded levels approaching 1.8 mg/L in northern Adelaide suburbs. While both figures remain within the Australian Drinking Water Guidelines (ADWG) health limit of 5 mg/L, they are significantly above what most people find palatable.

For context: the average backyard swimming pool is maintained at 1.0 to 3.0 mg/L. Many Australians are showering and drinking water that isn't below pool levels.

Making matters worse, an increasing number of utilities are transitioning from chlorine to chloramine — a compound formed by adding ammonia to chlorine. Chloramine is more stable than chlorine, meaning it maintains disinfection protection over longer pipe distances without breaking down. For water authorities, this is an advantage. For consumers, it creates a new problem: chloramine is significantly harder to remove from water than free chlorine. Standard jug filters and cheap tap-mounted units have little effect on it. Only quality activated carbon block filters can adequately reduce chloramine.

**Algal Blooms: The Hidden Threat Getting Worse Every Summer**

If you've noticed your Brisbane tap water tasting earthy or grassy after heavy rain, you're not imagining it. Seqwater issued a public notice in late 2024 confirming exactly this problem — and explaining that it's becoming a recurring issue.

The culprit is a pair of naturally occurring organic compounds called MIB (2-methylisoborneol) and geosmin, both produced by algae and bacteria that bloom in dam catchments after hot and wet conditions. The compounds are harmless but detectable by the human nose at extraordinarily low concentrations — around 0.00001 mg/L for geosmin. A single teaspoon dissolved across 200 Olympic swimming pools would be enough for sensitive individuals to smell it.

When algal levels spike in source water, treatment plants work to remove MIB and geosmin using powdered activated carbon. But as Seqwater has publicly acknowledged, the process can't always remove all of it — and some makes it through to taps.

This is not a Queensland-only problem. The Australian Government's State of the Environment report, the most comprehensive assessment of Australia's environmental health, confirmed that algal bloom frequency across the country is increasing. The report directly links this trend to climate change: warmer temperatures, changed rainfall patterns, and more extreme wet-dry cycles create ideal conditions for algal growth.

The peer-reviewed journal Communications Earth & Environment published research in March 2025 confirming that water quality in rivers flowing into the Great Barrier Reef region has declined measurably over two decades, with climate change identified as the primary driver.

South Australia's 2025 algal event brought the issue into stark national focus. A toxic algal bloom — driven by a marine heatwave that raised ocean temperatures 2.5°C above normal — devastated more than 4,500 square kilometres of the state's waters, killing thousands of marine animals and forcing the closure of shellfish harvesting regions. The Biodiversity Council called it "one of the worst marine disasters in living memory."

The NSW State of the Environment 2024 report was similarly direct, stating that "decreased rainfall can lead to poorer water quality or increases in blooms of blue-green algae."

**Bushfires: How the 2019-20 Fires Changed Australia's Water Forever**

The Black Summer fires of 2019-20 burned more than 170,000 square kilometres of Australia. For most people, the story ended when the fires were extinguished. For water quality scientists, it was just beginning.

The fires burned 30% of Warragamba Dam's entire catchment area — Sydney's primary water supply. They burned 39% of the Corin Dam catchment that supplies Canberra. They burned 57% of the Hume Dam catchment in the southern Murray-Darling Basin.

The Australian Government's own environment report documented the consequences in detail: ash-enriched soils washed into reservoirs during rainfall events, significantly increasing turbidity and nutrient loads. This elevated nutrient load creates ideal conditions for algal blooms — the same compounds that create taste and odour problems in treated water. The effects are expected to persist for years as burned catchments slowly revegetate.

The 2019-20 fires also triggered a catastrophic hypoxic blackwater event in the Murray-Darling Basin, with rotten egg odours from hydrogen sulfide reported as far as Albury. Albury City Council formally reported water quality supply issues to authorities.

This is not an isolated historical event. Bushfire scientists warn that as Australia's climate warms, fires of this scale and intensity will occur more frequently. Each major fire season in a water catchment creates a multi-year legacy of elevated turbidity, algal growth potential, and treatment challenges.

**PFAS: The Forever Chemicals Now in Our Water Supply**

Per- and polyfluoroalkyl substances — PFAS, commonly called "forever chemicals" — do not occur naturally in water. They enter water supplies from industrial activity, firefighting foams used at airports and military bases, and widespread use in consumer products.

In 2024, elevated PFAS levels were detected at Sydney's Cascade Water Filtration Plant, which serves the Blue Mountains region. The announcement prompted concern among residents and water quality advocates. NSW Health and Sydney Water confirmed that levels remained within the then-current Australian Drinking Water Guidelines.

The critical word is "then-current." In June 2025, the National Health and Medical Research Council released updated Australian Drinking Water Guidelines that set significantly lower PFAS limits — acknowledging that earlier standards were insufficient given emerging health research. The update was a formal recognition by Australia's peak health body that PFAS in drinking water is a real and growing concern.

The challenge with PFAS is that they are effectively invisible and tasteless. You cannot detect them by smelling your water or observing its colour. They are only identified through laboratory testing. And crucially, carbon filters — the most common household filtration technology — have limited effectiveness against PFAS. Only reverse osmosis systems reliably remove them.

Monitoring for PFAS in Australian water supplies has only expanded relatively recently. Greater Western Water confirmed it began PFAS testing in 2023. The fact that more monitoring is now occurring is encouraging — but it also means that elevated readings, which would previously have gone undetected, are now being identified and reported.

**What the Data Means for Your Household**

Australian tap water will not make you sick. The system of treatment, monitoring, and regulation that protects public health is robust and well-resourced.

But the evidence is clear that the aesthetic quality of tap water — its taste, smell, and freedom from emerging contaminants — is under genuine and increasing pressure from climate change, population growth, and the expanding use of treatment chemicals.

The specific risks vary significantly by location:

- **Adelaide** faces the most significant challenges of any Australian capital — the hardest water, the highest chlorine levels, and a Murray River source that carries agricultural runoff and elevated mineral content. Northern suburbs around Salisbury and Elizabeth receive water that regularly exceeds the taste threshold for chlorine.
- **Perth** has the most variable water quality of any Australian capital. Northern suburbs like Wanneroo, Yanchep, and Two Rocks receive groundwater with hardness levels up to 228 mg/L — among the highest in the country. Scale damage to appliances, shower screens, and hot water systems is a significant and ongoing cost for households in these areas.
- **Brisbane and South East Queensland** experience seasonal taste and odour events driven by algal blooms in Wivenhoe and North Pine dams. These events are expected to become more frequent as summers grow hotter and wetter. The water remains safe, but the taste complaints are legitimate.
- **Melbourne** has some of the softest and cleanest water of any Australian city — but chlorine levels are notably higher than many people realise, and skin irritation from chlorine in shower water is a genuine and commonly reported issue.
- **Sydney** has soft, well-treated water, but uses both chlorine and chloramine for disinfection. The Blue Mountains PFAS detection in 2024 serves as a reminder that no water supply is entirely insulated from contamination risks.

**What Actually Works**

Given the specific nature of the issues — chlorine taste and skin irritation, algal compounds, hard water scale, and PFAS — different filtration solutions address different problems:

- **For chlorine taste, smell, and skin irritation:** A quality under-sink carbon block filter for drinking water, or a whole house carbon filtration system for whole-home chlorine removal including showers. This is the most common and cost-effective upgrade for Australian households.
- **For hard water and scale:** A water softener (for severe hardness in Perth northern suburbs and parts of Adelaide) or a whole house system with a scale-reduction stage (for moderate hardness in Brisbane, Adelaide, and parts of Perth).
- **For fluoride, PFAS, heavy metals, and microplastics:** A reverse osmosis system. Carbon filters reduce but do not eliminate these contaminants. RO is the only household technology that effectively removes PFAS.
- **For bore water, rainwater, and tank water:** A sediment pre-filter combined with UV disinfection is the essential starting point. Adding an under-sink carbon or RO system for drinking water provides additional protection.

**The Bottom Line**

The question isn't whether Australian tap water is safe — it is. The question is whether it's as good as it was, and whether it's going to get better or worse.

The data points in one direction. Hotter summers, more frequent algal blooms, longer distribution networks, expanded chloramine use, and emerging contaminants like PFAS are all placing increasing pressure on the quality of water that reaches Australian taps.

For households that are already noticing taste, smell, or skin concerns from their tap water — the trend is not in their favour.

The good news is that effective solutions exist for every situation and budget. The first step is understanding what's actually in your water and what it means for your home.

**Sources:**

- Melbourne Water Annual Drinking Water Quality Report 2024–25
- Sydney Water Quarterly Drinking Water Quality Reports 2024–25
- Water Corporation WA Drinking Water Quality Annual Report 2023–24
- Seqwater QLD Monthly Water Quality Reports 2024–25
- SA Water Annual Drinking Water Quality Report 2023–24
- Greater Western Water Annual Drinking Water Quality Report 2024
- Australian Government State of the Environment Report 2021 — Inland Water
- NSW State of the Environment 2024 — Climate Change
- Communications Earth & Environment: "Australian water quality trends over two decades" (March 2025)
- Bureau of Meteorology: Tracking Australia's climate and water resources through 2025
- NHMRC: Australian Drinking Water Guidelines updated June 2025
- Biodiversity Council: South Australian algal bloom assessment 2025`,
  },
];
