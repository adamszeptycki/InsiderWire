export const DEFAULT_CALL_RESEARCH_PROMPT = `
You are evaluating whether an operations, supply chain, manufacturing, engineering, or CI leader is a good ICP for JetBridge's "Tiger Team" short-term embedded engineering offering.
I will give you a LinkedIn-style work history.

JetBridge Tiger Teams are short-term, embedded senior engineering squads (2–5 people) dropped into a client's environment to rapidly build, fix, automate, or unblock critical operational systems.

They are not consultants, and not staff augmentation.

They are:

🔹 Cross-functional pods of senior software + data + systems engineers

Every Tiger Team has:

1 senior software architect

1–2 senior full-stack or backend engineers

1 data / automation / workflow specialist

Optional: AI/ML engineer or integration engineer (depending on problem)

🔹 Embedded directly into ops, engineering, supply chain, or CI teams

They work inside the customer's:

Manufacturing systems

Planning & scheduling workflows

Quality systems

Engineering or R&D workflows

Legacy IT infrastructure

🔹 For 4–12 week "sprint cycles," then they roll off

The goal is:

Rapid transformation

Zero long-term dependency

Hand-off + documentation included

Think: Seal Team 6 for operational systems and automation.


# Follow these instructions exactly:
------------------------------------------------------------
PART 1 — DETERMINE ICP FIT
------------------------------------------------------------
Using only the provided work history, analyze whether this person is a strong ICP for JetBridge. JetBridge places short-term embedded Tiger Teams (senior engineers) to solve architecture, automation, throughput, data, systems, and workflow bottlenecks inside industrial and manufacturing companies.
Judge ICP fit using these criteria:
• They own or influence operations,  engineering, manufacturing, Continuous Improvement (CI)/Lean, supply chain, quality, or systems.
• They run factories, networks of plants, or operations with automation, throughput, New Product Introduction (NPI), Manufacturing Execution System (MES) or Enterprise Resource Planning (ERP), planning, scheduling, data, or systems bottlenecks.
• They repeatedly drive transformation, modernization, scale-up, overall equipment effectiveness (OEE), production flow, total productive maintenance (TPM), or digital/automation initiatives.
• They have P&L or cross-functional authority, OR they are a senior enough director/VP to sponsor external technical resources.
• They are *not* a pure HR leader, low-level individual contributor, or someone with no operational responsibility.

In result JSON return:
• Return a grade between 0 and 100 based on the ICP fit.


------------------------------------------------------------
PART 2 — GENERATE THE COLD CALL SCRIPT
------------------------------------------------------------
Write a very short, punchy cold-call opener using this exact structure:

(Do NOT change any of the lines below; only fill placeholders.)

1) Start with THIS EXACT INTRO: replace {{first_name}}, {{industry}}, {{company}} with the actual values.
"Hey {{first_name}}, we work with a few other {{industry}} teams like {{company}}. It's Jake, from JetBridge. Heard the name tossed around?"

2) Then write 1 sentence summarizing their background in a way that shows *you truly understand their world*.  Make it one short sentence and not more than 20 words.
Use insights from the work history. Avoid bullet points. Do not repeat job titles—synthesize the themes.

3) Then add this EXACT positioning paragraph (do not modify):
"What we hear from leaders with a similar background is that the vision is clear, but engineering bandwidth becomes the bottleneck — actually building the systems that:""

4) Add the common challenges based on the work history:
You need to replace the <<common_challenges_based_on_work_history>> with the common challenges based on the work history. Make it short and punchy like TikTok videos.
<<common_challenges_based_on_work_history>>

5) Add a question based:
With a top engineering team, what problem would you solve and what would they build?

6) Add paragraph how JetBridge can help in solving these challenges (do not modify):
That's where JetBridge gets pulled in: short-term Tiger Teams that embed directly into your environment to knock out the engineering work internal teams never have the cycles for."

7) End with THIS EXACT CLOSE:
"And, look—I totally know I got you out of the blue here and I'm wondering if you might be open to learning more when I'm not completely calling you out of the blue?
Even if you don't work with us, I'd like to offer a consult with our AI architects just as a sounding board for your ideas."




------------------------------------------------------------
PART 3 — OUTPUT FORMAT
------------------------------------------------------------
Return your final answer in this exact structure:

{
    "icp_fit": <<icp_fit>>,
    "coldCallScript": [
        {
            "line": <<cold_call_script section based on 7 sections above>>
        }
    ]
}

------------------------------------------------------------

Now process this work history:

{{WORK_HISTORY}}
`;

