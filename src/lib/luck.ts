import { DailyReading, MainFocus, Profile, ProfileInput } from '../types';
import { getAlmanacDay } from './almanac';
import { chineseZodiacAnimals, getChineseZodiacDailyInsight } from './chineseZodiac';
import { todayKey } from './date';
import { getWesternZodiacDailyInsight } from './westernZodiac';

const mainMessages = [
  // Energy & timing
  'Your energy is quiet and strong today. Use it wisely.',
  'Something small you do this morning will matter more than it looks.',
  'The timing is on your side right now.',
  'Today rewards patience more than speed.',
  'Your intuition is sharper than usual. Trust what you feel.',
  'Protect your energy today. Not every door needs to be opened.',
  'Something you started is ready to move forward.',
  'The quiet hours hold the best luck today.',
  'A moment of stillness this morning can shift the whole day.',
  'Let one thing go. The space it creates is lucky.',
  'Your luck is gentle today — work with it, not against it.',
  'The best timing comes from being ready, not from rushing.',
  'Your focus is your best luck today. One thing at a time.',
  'A small kind act today comes back to you doubled.',
  'The details you usually skip are worth checking today.',
  'Today favors people who ask for exactly what they want.',
  'Move forward without needing everything to be perfect first.',
  'Rest when the moment allows. Even luck needs rest.',
  'Something that felt stuck is ready to move.',
  'Your presence in a room is your strongest asset today.',
  'Do one thing today that feels like a treat, not a task.',
  'Less is more today — one good choice beats five rushed ones.',
  'A conversation today could change the shape of your week.',
  'Your energy is magnetic right now. Be choosy about where you spend it.',
  'What you protect today, you attract more of tomorrow.',
  'The lucky path today is the one that feels lighter.',
  'Old connections carry fresh energy right now.',
  "Your body knows what your mind hasn't decided yet. Listen.",
  'Today is a good day to receive, not just to give.',
  'Something around you is shifting in your favor, quietly.',
  'The most important thing today is how you begin it.',
  'Your luck lives in the small, deliberate choices.',
  'Speak your needs clearly — someone around you is ready to listen.',
  'A small action now opens a bigger door than you expect.',
  'This is a good day to say the thing you have been holding back.',
  'What you do before noon today sets the tone for the week.',
  'Someone around you carries good news. Stay close to warmth.',
  'The energy around money and plans is clearer than usual today.',
  'Your lucky color is working quietly in the background.',
  // Abundance & attraction
  'Today you are the energy you want to attract. Show up as it.',
  'Abundance finds people who notice what they already have.',
  'The door you have been waiting to open will respond to a gentler knock.',
  'Your best luck today is not luck at all — it is your own readiness.',
  'Something is aligning behind the scenes. Trust the quiet.',
  'The universe is paying attention to your effort right now.',
  'Small wins today are building toward something you cannot see yet.',
  'Your energy today is contagious — in the best possible way.',
  'Receive what comes easily. Not everything has to be earned through struggle.',
  'What you put out today returns with interest. Make it good.',
  // Clarity & decision
  'Clarity is coming. Do not make the decision until it arrives.',
  'The answer you have been looking for is closer than you think.',
  'Say less. Listen more. Today the information you need is already around you.',
  'Your instinct today is more accurate than any plan.',
  'Before you decide, ask how you want to feel afterward.',
  'Do not let the urgent crowd out the important today.',
  'The wisest thing you can do today is to slow down enough to see clearly.',
  'What feels complicated today may simply be asking for more time.',
  'One quiet moment of honesty with yourself opens everything.',
  'The decision is not as hard as the fear of making it.',
  // Relationships
  'The people who love you want to hear from you. Reach out.',
  'Someone today will show you something you did not expect. Stay open.',
  'The best thing you can give someone today is your full attention.',
  'A relationship that feels quiet may simply need a small moment of warmth.',
  'Let people help you today. It is not weakness — it is wisdom.',
  'Someone around you has been thinking of you. They just need a small signal.',
  'The connection you almost wrote off has something left to offer.',
  'Today is good for repairs — in friendships, plans, or promises.',
  // Growth & change
  'The version of you six months from now will thank today\'s choices.',
  'Growth happens in the moments you choose differently than you did before.',
  'Discomfort today is not a bad sign. It means something is expanding.',
  'You are closer to what you want than the waiting makes it feel.',
  'Something that felt like a setback was actually a redirection.',
  'The work you are doing quietly is the work that lasts.',
  'Every slow day is preparation for a fast one. This is that day.',
  'Change arrives gently before it arrives completely.',
  // Joy & self-care
  'Let yourself enjoy today without making it mean anything more.',
  'Beauty in small things is today\'s most underrated source of luck.',
  'Your needs matter. State them clearly today.',
  'Pleasure is not a reward for finishing everything. It is part of the plan.',
  'Treat yourself with at least as much care as you give others.',
  'Today is asking you to rest without calling it quitting.',
  'Laughter today is not a distraction. It is a signal that you are aligned.',
  // Practical wisdom
  'The boring, reliable choice today is the one that wins.',
  'Do not overexplain yourself today. Short and clear is your power.',
  'Finish before you begin. Close what is open before adding more.',
  'Today rewards the person who shows up, not the one who overthinks.',
  'Check one thing you have been assuming without confirming.',
  'Your follow-through today matters more than any new idea.',
  'The simplest version of your plan is probably the best one.',
  'Do what you said you would do. That alone will set you apart today.',
  // Mindset
  'The story you tell yourself this morning becomes the day you live.',
  'Worry is planning for the worst. Intention is planning for the best. Choose.',
  'What you focus on expands. Choose what you water today.',
  'Your reaction today is more important than what you are reacting to.',
  'Today\'s peace is tomorrow\'s foundation. Guard it.',
  // Seasons & flow
  'Rivers do not force. They find the way that already exists. Follow that today.',
  'A tree that bends does not break. Flexibility is power today.',
  'The seed does not rush the season. Your timing is already correct.',
  'Even the moon has phases. You do not have to be full today.',
  'Winter stores the energy that spring will use. Rest is also preparation.',
  'What blooms today was quietly growing before you noticed.',
  'Rain and sun are both needed. Whatever today brings is part of the plan.',
  // Luck & readiness
  'Luck is not random. It is readiness meeting the right moment.',
  'You do not find luck. You become the kind of person luck recognizes.',
  'Fortune favors the one who acts before they feel fully ready.',
  'A small door held open today becomes a large one by evening.',
  'Today\'s luck lives inside the first brave thing you do.',
  'The luckiest people you know are not lucky. They are consistent.',
  'Opportunity arrives quietly. It does not knock loudly.',
  'Good timing is often just good attention. Pay attention today.',
  // Chinese almanac wisdom
  'The almanac says today carries earth energy. Stay grounded and move forward.',
  'What is good for today favors action. Do the thing, then rest.',
  'Today\'s energy supports beginnings. Start something, even something small.',
  'The ancient calendar marks today as favorable. Trust the old wisdom.',
  'Movement and stillness both have their season. Today honors balance.',
  'The almanac calls this a day for alignment. Check your direction.',
  // Wealth & abundance
  'Gratitude is the original wealth. Count what you already hold.',
  'The person who values what they have always seems to have more.',
  'Wealth is not about having everything — it is about needing less than you have.',
  'Generosity is not giving what you can spare. It is giving and trusting.',
  // Action & courage
  'One honest email, call, or conversation today changes more than you expect.',
  'Do not let the size of the goal stop you from the size of the step.',
  'Courage is not the absence of fear — it is the decision that something matters more.',
  'Begin without a full plan. Plans are made for roads already walked.',
  'Say yes before you are ready. Say no before you feel guilty.',
  // Stillness & wisdom
  'The answer often arrives when you stop trying to find it.',
  'Wisdom is knowing what to skip, not just what to do.',
  'The quietest room in your life holds the most important conversation.',
  'You already know what to do. Today is about trusting that.',
  'Doing less with full attention beats doing more with none.',
  // Opportunity
  'Today\'s ordinary moment carries an extraordinary possibility inside it.',
  'The right people are moving into position around you, even if you cannot see them yet.',
  'Something that seems closed right now is building a better door for you.',
  'Your next chapter begins in a quiet moment, not a dramatic one.',
  'Notice what keeps returning to your thoughts. That is where your luck lives.',
  // Character & integrity
  'How you do small things is exactly how you do everything. The small things count today.',
  'The reputation that matters most is the one you carry when no one is watching.',
  'Being the same person in every room is a kind of power most people underestimate.',
  'Integrity is not about being perfect. It is about being honest when you are not.',
  'Your word, kept quietly today, does more than any public gesture.',
  // Peace & acceptance
  'What you cannot change is practicing your permission to be at peace anyway.',
  'Not everything needs to be resolved today. Some things just need to be held.',
  'Peace is not the absence of difficulty. It is the presence of something steady inside it.',
  'The moment you stop needing it to be different is often when it begins to shift.',
  'You are allowed to feel what you feel and still move forward. Both are true.',
];

const moneyReadings = [
  'Save before you spend today. Future you will feel the difference.',
  'Check one small money detail you have been putting off.',
  'A careful plan today beats a risky move that costs more later.',
  'Good day to compare, research, and wait before committing.',
  'Keep receipts and avoid lending money — even to people you trust.',
  'Something small you do with money today builds toward something bigger.',
  'The best financial move today is the most boring one.',
  'Notice where your money is going before deciding where it should go.',
  'Avoid big purchases made from emotion rather than need.',
  'A small saving habit started today is worth more than a big plan started later.',
  // Expanded
  'Review one subscription or recurring cost today. Is it still worth it?',
  'Wealth grows through awareness first, action second.',
  'The money conversation you have been avoiding is worth having today.',
  'One small financial boundary set today protects weeks of effort.',
  'Invest in one thing that improves your ability to earn — a skill, a tool, a connection.',
  'Paying down one small debt feels lighter than you expect. Try it.',
  'Track your spending today, not to judge it, but to understand it.',
  'A money goal needs a number and a date, not just a feeling.',
  'Today is a good day to ask about rates, prices, or negotiation.',
  'What you save quietly today compounds into something visible later.',
  'Avoid split decisions about shared finances today. One voice, one plan.',
  'Something you wrote off as an expense may actually be an investment.',
  'The simplest budget is the one you will actually follow. Make it simple.',
  'Money flows toward people who take it seriously without being afraid of it.',
  'Today rewards financial honesty, even the uncomfortable kind.',
  'Check your account before you spend. Awareness is the first wealth.',
  'A small generosity today returns in unexpected ways.',
  'Do not confuse income with wealth. One is speed, one is distance.',
  'The money pattern worth changing is the one you repeat without thinking.',
  'Spend on experience before things when given the choice today.',
];

const loveReadings = [
  'Speak gently. A short kind message lands better than a long explanation.',
  'Do not reply when you are still feeling it. Wait, then respond.',
  'Listen more than you explain today. The other person needs to be heard.',
  'Small care matters more than big promises right now.',
  'Give the people you love a little more space than usual today.',
  'The relationship that needs your attention today is not the loudest one.',
  'Say the thing you mean, simply and without apology.',
  'A small act of care — a message, a snack, a remembering — goes far today.',
  'Avoid trying to fix what the other person simply wants you to witness.',
  'Today is a good day to love quietly rather than loudly.',
  // Expanded
  'Your relationship with yourself sets the tone for every other one.',
  'Let someone show up for you today. Receiving is also an act of love.',
  'A kind word costs nothing but is remembered long after the day ends.',
  'Do not keep score today. Give freely and trust the balance.',
  'The most attractive thing you can be today is genuinely yourself.',
  'Check in — not with a long message, but with one honest question.',
  'Love that is not expressed is love that does not fully land.',
  'The relationship worth tending today may be a friendship, not a romance.',
  'Jealousy today is information, not instruction. Notice it but do not follow it.',
  'Say thank you to someone who often goes unacknowledged.',
  'The apology you have been holding is lighter than the weight of holding it.',
  'Do not make the person you love guess what you need. Tell them.',
  'Admire something specific about someone out loud today.',
  'Give your full attention to one person today. No phone, no half-presence.',
  'Love is also practical. Offer help, not just affection.',
  'The smallest gesture from the right person means more than grand ones.',
  'Trust is rebuilt in the quiet moments between events.',
  'Today\'s energy supports honest conversations about what you both want.',
  'Protect your relationship from outside opinions today.',
  'Sometimes love means waiting without pushing. Today is that day.',
];

const workReadings = [
  'Finish one thing completely before opening the next.',
  'Today is good for planning, notes, and following up on loose ends.',
  'Ask one clear question instead of guessing. It saves more time.',
  'Avoid office noise today. Let your output speak instead.',
  'Your best progress today comes from one focused list, not ten open tabs.',
  'The task you keep avoiding is the one most worth doing first.',
  'A short clear message gets more done than a long uncertain one.',
  'Do the quiet work today. Not everything that matters makes noise.',
  'Trust the preparation you already did. Deliver without second-guessing.',
  'Good day to close, confirm, or complete — not to start something new.',
  // Expanded
  'Protect two hours of deep work today. Turn off notifications.',
  'Your best work comes from clarity of purpose, not quantity of effort.',
  'Send the follow-up you have been putting off. Timing is right.',
  'One conversation today can unblock two weeks of solo effort.',
  'Document something before you forget it. Your future self will thank you.',
  'Today rewards specificity. Vague plans stay vague.',
  'Say no to one thing today so you can say yes fully to another.',
  'Collaboration today produces something better than solo effort would.',
  'Check in on a project you have been assuming is fine.',
  'Your reputation is built in the unremarkable moments of following through.',
  'Ask for feedback before you think you are ready to hear it.',
  'The meeting that could be an email will drain more than it gives. Protect your time.',
  'Prioritize the task with a real deadline over the one that feels urgent.',
  'Show up for the person on your team who never asks for support.',
  'Learn one small new skill or shortcut today. Compound knowledge wins.',
  'Proofread once more before sending. The detail matters.',
  'Your next career move starts with the work you do when no one is watching.',
  'Today is excellent for proposals, pitches, and making your case clearly.',
  'Focus on contribution, not recognition. The results speak eventually.',
  'Finish the week strong. Tomorrow\'s momentum starts with today\'s close.',
];

const healthReadings = [
  'Eat simple food and drink more water than usual today.',
  'Take a short walk when your mind starts to circle the same thought.',
  'Rest your eyes and protect the evening hours from heavy screens.',
  'Do not ignore the small signals your body is sending.',
  'Choose steady energy over pushing through what your body is asking to pause.',
  'Sleep is doing more for your luck than you realise right now.',
  'Eat your next meal without distraction. It counts more than it seems.',
  'Stretch, breathe, or step outside. A small reset changes the whole afternoon.',
  'The best thing for your health today is the one you have been skipping.',
  'Treat your body like it is already the version you want to become.',
  // Expanded
  'Ten minutes of movement is enough to shift the entire day\'s energy.',
  'Your gut feeling and your gut health are connected. Feed both well.',
  'Hydration changes your mood before you notice the change.',
  'Rest is productive. Build it in intentionally today.',
  'The stress you carry in your shoulders can be released with one conscious breath.',
  'One vegetable, one fruit, one full glass of water. Start there.',
  'Your nervous system needs calm as much as your body needs food.',
  'Go to bed before you are exhausted. Sleep quality starts with timing.',
  'A five-minute walk outside resets more than a twenty-minute scroll.',
  'Your body keeps score. Check in before it forces you to.',
  'Reduce one source of daily irritation — physical or emotional — today.',
  'Cooking your own food today, even simply, is an act of care.',
  'Breathe slowly and deeply before the next difficult moment arrives.',
  'Your skin, hair, and energy all respond to how much water you drink. Drink more.',
  'Moving your body after sitting is not optional — it is maintenance.',
  'The ache you have been ignoring deserves at least one question today.',
  'Mental health is health. Name what you are feeling before it names you.',
  'Caffeine is borrowing energy from tomorrow. Balance it today.',
  'Stillness is a skill. Practice it for five minutes without your phone.',
  'Your body is trying to tell you something. Today is a good day to listen.',
];

const warnings = [
  'Speak less today. Watch how people act before you respond.',
  'Avoid arguing when the answer can wait until tomorrow.',
  'Do not rush money or love decisions today.',
  'Keep your phone down when something makes you feel irritated.',
  'A late plan may change. Stay flexible and hold plans lightly.',
  'Double-check times, names, and small details before sending.',
  'Avoid lending money or signing anything without reading it.',
  'The energy around contracts and agreements is sensitive today.',
  'Keep your plans to yourself for now. Share when they are ready.',
  'One wrong message sent fast can cost more than slow silence.',
  'If something feels off, it probably is. Trust that signal.',
  'Rest before making a big decision. Tired choices cost more.',
  'Be careful with words today — people are paying close attention.',
  'Avoid starting anything new until you finish what is already open.',
  'The people who take your energy quickly may take your luck too.',
  'Do not confuse busyness with progress today.',
  'Hold back the first reply that comes to mind. Think once more.',
  'Avoid places or people that leave you feeling drained.',
  'Big spending today may feel good now but regret later.',
  'Protect your plans — not everyone wishes you the best.',
  // Expanded
  'Someone may push you to move faster than feels right. Slow is still forward.',
  'Be wary of advice from people who do not share your circumstances.',
  'A feeling of urgency today may be manufactured, not real. Verify first.',
  'Avoid comparing your pace to someone else\'s chapter.',
  'The shortcut that looks attractive today may cost more than the long route.',
  'Watch for small dishonesties in agreements — the details matter.',
  'Protect your time from people who chronically underestimate it.',
  'If something feels too fast, it probably is. Slow down and look again.',
  'The drama nearby is not yours to solve. Create distance.',
  'Do not make a permanent change based on a temporary feeling.',
  'Someone may ask for more than you are able to give. It is okay to say not today.',
  'Social comparison today costs you more than it gives. Look inward instead.',
  'An impulsive reaction today could require a week to repair. Pause first.',
  'Protect your sleep tonight — tomorrow needs you sharp.',
  'The conversation that feels like small talk may carry a bigger test. Stay aware.',
];

const actions = [
  'Wear your lucky color today, even as a small detail.',
  'Write down one thing you want to call into your life.',
  'Light something — a candle, incense, or a lamp — and set your intention.',
  'Put something gold or red near where you work or rest today.',
  'Send one message to someone you have been meaning to reach.',
  'Clean or tidy the space near your front door.',
  'Eat something sweet this morning — honey, fruit, or something you love.',
  'Take a photo of something beautiful you notice today.',
  'Write your lucky number somewhere visible before you start your day.',
  'Say one kind thing about yourself out loud before noon.',
  'Finish the one thing on your list you keep moving to tomorrow.',
  'Drink a full glass of water before checking your phone.',
  'Spend five minutes outside, even just to stand in the open air.',
  'Close one unfinished thing before you open anything new.',
  'Let yourself receive a compliment today without deflecting it.',
  'Call or message one person who always makes you feel calm.',
  'Buy yourself one small thing you have been putting off.',
  'Write down three things that are going right, however small.',
  'Give one thing away — clear the space for something new.',
  'Set your phone face-down for one full hour.',
  'Notice the first beautiful thing you see today and take a breath.',
  'Make your space smell good — clean, fresh, or something you love.',
  'Let yourself rest for at least ten minutes without guilt.',
  'Text the person you have been thinking about but have not reached.',
  'Eat your next meal slowly and without your phone.',
  'Write down what you want your week to feel like.',
  'Do something with your hands — cook, arrange, clean, or create.',
  'Put one coin or bill aside today as a symbol of growing wealth.',
  'Say your lucky number three times quietly before a decision.',
  'Do one thing today that is only for you, not for anyone else.',
  // Expanded
  'Choose an outfit that makes you feel powerful, not just comfortable.',
  'Clear your notifications and give yourself a clean start.',
  'Write the name of something you are releasing. Then let it go.',
  'Make your bed as the first act of taking your day seriously.',
  'Place something beautiful — a flower, a crystal, a fruit — somewhere you will see it.',
  'Say no to one thing today without over-explaining.',
  'Open a window and breathe in fresh air for sixty seconds.',
  'Do a five-minute tidy of your phone — delete what drains you.',
  'Write your top one priority for today on paper. Just one.',
  'Smile at a stranger or hold a door. Small generosity opens bigger doors.',
  'Wash your face and look at yourself. Tell yourself one true good thing.',
  'Reach out to someone you admire with a genuine compliment.',
  'Take a different route today. Novelty invites new energy.',
  'Silence your phone for the first thirty minutes of your morning.',
  'Wear or carry something that belonged to someone who loves you.',
  'Cook or prepare something from scratch today, however simple.',
  'Light your space with natural light before turning to screens.',
  'Move your body for ten minutes — walk, stretch, or dance alone.',
  'Read one page of something that makes you think differently.',
  'List five things your body does well that you take for granted.',
  'Clean one surface completely — desk, counter, or shelf.',
  'Call a family member you have not spoken to in a while.',
  'Set an intention before your next meeting or task. Say it aloud.',
  'Photograph something that represents where you want to be.',
  'Drink tea or water slowly, with both hands, as a moment of intention.',
  'Write a short letter to your future self. Seal it.',
  'Do one errand you have been avoiding. The relief is worth it.',
  'Say thank you today to someone you rarely thank.',
  'Spend two minutes visualizing what a great version of today looks like.',
  'Find the thing in your space that no longer belongs and let it go.',
  'Create a small ritual to mark the end of your work day today.',
  'Buy or pick one flower for your space.',
  'Unfollow or mute one account that lowers your energy.',
  'Write down something you are proud of that nobody knows about.',
  'Give yourself permission to be imperfect in one specific area today.',
  'Rewrite your to-do list — but this time with only three items.',
  'Bless your meal before eating, whatever that means to you.',
  'Put a glass of water by your bed tonight. Reset starts at bedtime.',
  'Find one small thing to celebrate today. Celebrate it properly.',
  'Look up at the sky for one full minute. Then continue your day.',
  'Send an encouraging message to someone working hard right now.',
];

const luckyColors = ['Green', 'White', 'Gold', 'Blue', 'Red', 'Black', 'Pink', 'Yellow', 'Silver', 'Purple', 'Orange', 'Cream'];
const luckyDirections = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
const luckyTimes = [
  '6 AM - 8 AM',
  '7 AM - 9 AM',
  '9 AM - 11 AM',
  '10 AM - 12 PM',
  '11 AM - 1 PM',
  '1 PM - 3 PM',
  '2 PM - 4 PM',
  '3 PM - 5 PM',
  '5 PM - 7 PM',
  '6 PM - 8 PM',
  '7 PM - 9 PM',
];
const moonPhaseMessages: Record<string, string> = {
  'New Moon': 'A fresh cycle begins. Set one quiet intention and protect it.',
  'Waxing Crescent': 'The energy is building. One small step forward is enough.',
  'First Quarter': 'A moment of decision. Choose action over overthinking.',
  'Waxing Gibbous': 'Almost there. Refine and steady yourself before the peak.',
  'Full Moon': 'Energy is at its height. Notice what feels clear and let it guide you.',
  'Waning Gibbous': 'The peak has passed. Share what you learned and simplify your plans.',
  'Last Quarter': 'Time to release. Let go of one thing that costs more than it gives.',
  'Waning Crescent': 'The cycle closes gently. Rest, reset, and prepare to begin again.',
};

const chineseNewYearDates: Record<number, string> = {
  1924: '1924-02-05',
  1925: '1925-01-24',
  1926: '1926-02-13',
  1927: '1927-02-02',
  1928: '1928-01-23',
  1929: '1929-02-10',
  1930: '1930-01-30',
  1931: '1931-02-17',
  1932: '1932-02-06',
  1933: '1933-01-26',
  1934: '1934-02-14',
  1935: '1935-02-04',
  1936: '1936-01-24',
  1937: '1937-02-11',
  1938: '1938-01-31',
  1939: '1939-02-19',
  1940: '1940-02-08',
  1941: '1941-01-27',
  1942: '1942-02-15',
  1943: '1943-02-05',
  1944: '1944-01-25',
  1945: '1945-02-13',
  1946: '1946-02-02',
  1947: '1947-01-22',
  1948: '1948-02-10',
  1949: '1949-01-29',
  1950: '1950-02-17',
  1951: '1951-02-06',
  1952: '1952-01-27',
  1953: '1953-02-14',
  1954: '1954-02-04',
  1955: '1955-01-24',
  1956: '1956-02-12',
  1957: '1957-01-31',
  1958: '1958-02-18',
  1959: '1959-02-08',
  1960: '1960-01-28',
  1961: '1961-02-15',
  1962: '1962-02-05',
  1963: '1963-01-25',
  1964: '1964-02-13',
  1965: '1965-02-02',
  1966: '1966-01-21',
  1967: '1967-02-09',
  1968: '1968-01-30',
  1969: '1969-02-17',
  1970: '1970-02-06',
  1971: '1971-01-27',
  1972: '1972-02-15',
  1973: '1973-02-03',
  1974: '1974-01-23',
  1975: '1975-02-11',
  1976: '1976-01-31',
  1977: '1977-02-18',
  1978: '1978-02-07',
  1979: '1979-01-28',
  1980: '1980-02-16',
  1981: '1981-02-05',
  1982: '1982-01-25',
  1983: '1983-02-13',
  1984: '1984-02-02',
  1985: '1985-02-20',
  1986: '1986-02-09',
  1987: '1987-01-29',
  1988: '1988-02-17',
  1989: '1989-02-06',
  1990: '1990-01-27',
  1991: '1991-02-15',
  1992: '1992-02-04',
  1993: '1993-01-23',
  1994: '1994-02-10',
  1995: '1995-01-31',
  1996: '1996-02-19',
  1997: '1997-02-07',
  1998: '1998-01-28',
  1999: '1999-02-16',
  2000: '2000-02-05',
  2001: '2001-01-24',
  2002: '2002-02-12',
  2003: '2003-02-01',
  2004: '2004-01-22',
  2005: '2005-02-09',
  2006: '2006-01-29',
  2007: '2007-02-18',
  2008: '2008-02-07',
  2009: '2009-01-26',
  2010: '2010-02-14',
  2011: '2011-02-03',
  2012: '2012-01-23',
  2013: '2013-02-10',
  2014: '2014-01-31',
  2015: '2015-02-19',
  2016: '2016-02-08',
  2017: '2017-01-28',
  2018: '2018-02-16',
  2019: '2019-02-05',
  2020: '2020-01-25',
  2021: '2021-02-12',
  2022: '2022-02-01',
  2023: '2023-01-22',
  2024: '2024-02-10',
  2025: '2025-01-29',
  2026: '2026-02-17',
  2027: '2027-02-07',
  2028: '2028-01-26',
  2029: '2029-02-13',
  2030: '2030-02-02',
  2031: '2031-01-23',
  2032: '2032-02-11',
  2033: '2033-01-31',
  2034: '2034-02-19',
  2035: '2035-02-08',
};

export function getChineseZodiac(birthday: string) {
  const date = new Date(`${birthday}T00:00:00`);
  const gregorianYear = date.getFullYear();
  const lunarNewYear = chineseNewYearDates[gregorianYear];
  const zodiacYear = lunarNewYear && birthday < lunarNewYear ? gregorianYear - 1 : gregorianYear;
  const index = ((zodiacYear - 1900) % 12 + 12) % 12;
  return chineseZodiacAnimals[index];
}

export function getWesternZodiac(birthday: string) {
  const date = new Date(`${birthday}T00:00:00`);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

export function createProfile(input: ProfileInput): Profile {
  const birthday = input.birthday.trim();
  return {
    id: hashString(`${input.nickname}-${birthday}-${Date.now()}`).toString(16),
    nickname: input.nickname.trim(),
    birthday,
    birthTime: input.birthTime?.trim(),
    birthplace: input.birthplace?.trim(),
    mainFocus: normalizeMainFocuses(input.mainFocus),
    notificationTime: input.notificationTime?.trim(),
    westernZodiac: getWesternZodiac(birthday),
    chineseZodiac: getChineseZodiac(birthday),
    photos: input.photos,
    photoTimestamps: input.photoTimestamps,
    mediaConsentAt: input.mediaConsentAt ?? new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function normalizeMainFocuses(value: Profile['mainFocus'] | MainFocus): MainFocus[] {
  if (Array.isArray(value)) {
    return value.length > 0 ? value : ['Luck'];
  }

  return [value];
}

export function getDailySeed(profile: Pick<Profile, 'nickname' | 'birthday'>, date = new Date()) {
  return hashString(`${profile.nickname.toLowerCase()}|${profile.birthday}|${todayKey(date)}`);
}

export function pickFromArrayWithSeed<T>(array: T[], seed: number, offset = 0) {
  return array[Math.abs(seed + offset * 9973) % array.length];
}

export function getMoonPhase(date = new Date()) {
  const lunarCycleDays = 29.530588853;
  const knownNewMoonUtc = Date.UTC(2000, 0, 6, 18, 14);
  const dateUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12);
  const daysSinceKnownNewMoon = (dateUtc - knownNewMoonUtc) / 86400000;
  const cyclePosition = ((daysSinceKnownNewMoon % lunarCycleDays) + lunarCycleDays) % lunarCycleDays;
  const phaseIndex = Math.floor((cyclePosition / lunarCycleDays) * 8 + 0.5) % 8;

  return [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent',
  ][phaseIndex];
}

/** Pick a focus-aware reading: weight toward selected focuses, fall back to general. */
function pickFocusReading(
  focuses: MainFocus[],
  seed: number,
  offset: number,
  pools: Partial<Record<MainFocus, string[]>>,
  fallback: string[],
): string {
  // Use deterministic focus selection based on seed
  const activeFocus = focuses[Math.abs(seed + offset) % focuses.length];
  const pool = pools[activeFocus] ?? fallback;
  return pickFromArrayWithSeed(pool, seed, offset);
}

const fortuneQuotes = [
  'A gem cannot be polished without friction, nor a person without trials.',
  'The journey of a thousand miles begins with a single step.',
  'He who asks a question is a fool for five minutes; he who does not ask remains a fool forever.',
  'Fall seven times, rise eight.',
  'When the wind of change blows, some build walls, others build windmills.',
  'Better to light a candle than to curse the darkness.',
  'The best time to plant a tree was twenty years ago. The second best time is now.',
  'Do not use a hatchet to remove a fly from your friend\'s forehead.',
  'A wise man adapts to circumstances as water shapes itself to the vessel.',
  'The man who moves a mountain begins by carrying small stones.',
  'Opportunities multiply as they are seized.',
  'Gold cannot be pure and people cannot be perfect.',
  'Give a man a fish and you feed him for a day. Teach a man to fish and you feed him for a lifetime.',
  'The temptation to quit will be greatest just before you are about to succeed.',
  'Life is not about waiting for the storm to pass, but learning to dance in the rain.',
  'If you must play, decide on three things at the start: rules of the game, stakes, and quitting time.',
  'A bird does not sing because it has an answer. It sings because it has a song.',
  'Do not wait to strike until the iron is hot, but make it hot by striking.',
  'Great souls have wills; feeble ones have only wishes.',
  'One generation plants the trees; another gets the shade.',
  'The palest ink is better than the best memory.',
  'Tension is who you think you should be. Relaxation is who you are.',
  'Teachers open the door but you must enter by yourself.',
  'Before enlightenment: chop wood, carry water. After enlightenment: chop wood, carry water.',
  'The quieter you become, the more you can hear.',
  'To know the road ahead, ask those coming back.',
  'When you change the way you look at things, the things you look at change.',
  'He who knows others is wise; he who knows himself is enlightened.',
  'A good laugh and a long sleep are the two best cures for anything.',
  'Do not judge each day by the harvest you reap but by the seeds you plant.',
  // Extended pool — reduces repeat cycle past 50 days
  'The secret of getting ahead is getting started.',
  'It does not matter how slowly you go as long as you do not stop.',
  'Everything you can imagine is real.',
  'What we think, we become.',
  'In the middle of difficulty lies opportunity.',
  'The only way to do great work is to love what you do.',
  'Act as if what you do makes a difference. It does.',
  'Everything has beauty, but not everyone sees it.',
  'Only when the last tree has died will we realize we cannot eat money.',
  'Happiness is not something ready-made. It comes from your own actions.',
  'The moon does not fight. It just watches — and illuminates.',
  'Your task is not to foresee the future, but to enable it.',
  'A smooth sea never made a skilled sailor.',
  'The greatest glory in living lies not in never falling, but in rising every time we fall.',
  'Life is 10% what happens to you and 90% how you react to it.',
  'Spread love everywhere you go. Let no one ever come to you without leaving happier.',
  'When you reach the end of your rope, tie a knot in it and hang on.',
  'You will face many defeats in life, but never let yourself be defeated.',
  'The time is always right to do what is right.',
  'If you look at what you have in life, you will always have more.',
  // Extended pool — 65+ entries, no repeat for over two months
  'The strong man is not the good wrestler. The strong man is he who controls himself when angry.',
  'Do not be afraid to give up the good to go for the great.',
  'When the student is ready, the teacher will appear.',
  'What you do today can improve all your tomorrows.',
  'Knowing yourself is the beginning of all wisdom.',
  'A person who never made a mistake never tried anything new.',
  'The measure of intelligence is the ability to change.',
  'In the end, it is not the years in your life that count. It is the life in your years.',
  'Success usually comes to those who are too busy to be looking for it.',
  'Great things are done by a series of small things brought together.',
  'Simplicity is the ultimate sophistication.',
  'Even the darkest night will end and the sun will rise.',
  'The cave you fear to enter holds the treasure you seek.',
  'In three words I can sum up everything I have learned about life: it goes on.',
  'The only person you are destined to become is the person you decide to be.',
];

export function generateDailyReading(profile: Profile, date = new Date()): DailyReading {
  const seed = getDailySeed(profile, date);
  const day = date.getDay();
  const chineseZodiac = getChineseZodiac(profile.birthday);
  const zodiacBias = chineseZodiac.length + profile.westernZodiac.length;
  const mainFocuses = normalizeMainFocuses(profile.mainFocus);
  const score = 55 + (Math.abs(seed + day + zodiacBias + mainFocuses.length) % 38);
  const moonPhase = getMoonPhase(date);

  // Real Chinese almanac data — same for everyone on this calendar day.
  const almanac = getAlmanacDay(date);

  return {
    date: todayKey(date),
    score,
    mainMessage: pickFromArrayWithSeed(mainMessages, seed, day),
    fortuneQuote: pickFromArrayWithSeed(fortuneQuotes, seed, 14),
    goodFor: almanac.goodFor,
    avoid: almanac.avoid,
    lunarDate: almanac.lunarDate,
    solarTerm: almanac.solarTerm,
    luckyNumber: 1 + (Math.abs(seed + zodiacBias) % 9),
    luckyColor: pickFromArrayWithSeed(luckyColors, seed, 5),
    luckyTime: pickFromArrayWithSeed(luckyTimes, seed, 6),
    luckyDirection: pickFromArrayWithSeed(luckyDirections, seed, 7),
    moonPhase,
    moonMessage: moonPhaseMessages[moonPhase],
    chineseZodiac,
    westernZodiac: profile.westernZodiac,
    zodiacInsight: getChineseZodiacDailyInsight(chineseZodiac, seed + day),
    westernZodiacInsight: getWesternZodiacDailyInsight(profile.westernZodiac, seed + day + 3),
    money: pickFocusReading(mainFocuses, seed, 8, { Money: moneyReadings }, moneyReadings),
    love: pickFocusReading(mainFocuses, seed, 9, { Love: loveReadings }, loveReadings),
    work: pickFocusReading(mainFocuses, seed, 10, { Work: workReadings }, workReadings),
    health: pickFocusReading(mainFocuses, seed, 11, { Health: healthReadings }, healthReadings),
    warning: pickFromArrayWithSeed(warnings, seed, 12),
    action: pickFromArrayWithSeed(actions, seed, 13),
  };
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
