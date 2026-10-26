// The whole story as data. Each level's gameplay lives in chapters/chN.jsx,
// keyed by level id; this file is only what the menus and intro cards show.
//
//   intro      what Bobby says on the level's intro card
//   goal       one line telling the player what to do

export const CHAPTERS = [
  { n: 1, title: 'The Loneliest Button Alive', emoji: '🥺' },
  { n: 2, title: 'The Dating App Disaster', emoji: '📱' },
  { n: 3, title: 'Bobby Gets Rejected', emoji: '💔' },
  { n: 4, title: 'The Villain Arc', emoji: '😈' },
  { n: 5, title: 'Love Across the Internet', emoji: '🌐' },
  { n: 6, title: 'Something Is Wrong With My Cursor', emoji: '🖱️' },
  { n: 7, title: 'Catch Your Crush', emoji: '🏃' },
  { n: 8, title: 'The Button Wedding', emoji: '💍' },
  { n: 9, title: 'The Great Cursor Crisis', emoji: '🔍' },
  { n: 10, title: 'The Final Love Story', emoji: '💘' },
];

const L = (id, title, goal, intro) => ({ id, chapter: Math.ceil(id / 5), title, goal, intro });

export const LEVELS = [
  // Chapter 1
  L(1, '404: Girlfriend Not Found', 'Reboot his heart: shock it while the pulse is in the green zone. Three times.', "BRO. PLEASE. FIND ME A GIRLFRIEND. I'M LITERALLY A BUTTON. Wait. First check if my heart even works."),
  L(2, 'Give Me a Glow-Up', 'Drag every accessory onto Bobby.', "Make me irresistible. I'm already a 10. Make me an 11."),
  L(3, 'Take My Dating Profile Picture', 'Snap 3 photos. At least one with Bobby inside the frame.', 'Get my good side. All my sides are good sides.'),
  L(4, 'The Worst Bio Ever Written', 'Fill every line of his dating bio, then publish it.', "Write my bio. Make it honest. But also lie a lot."),
  L(5, 'Zero Matches', 'Swipe away the fake notifications until a real match shows up.', "I refreshed the app 900 times. Something has to happen eventually."),
  // Chapter 2
  L(6, 'Swipe Right on Everything', "Bobby swipes right on everything. Swipe LEFT on anything that would delete him.", "I'm not picky. I'm open-minded. There's a difference."),
  L(7, 'The CAPTCHA Girlfriend', 'Select the right squares. Prove Bobby is not a robot.', "I matched with a CAPTCHA. She wants proof I'm not a robot. I am a button. This is going to be tight."),
  L(8, 'She Left Me on Read', 'Delete his messages before they reach her. Let 3 through at most.', "She hasn't replied in 4 seconds. I'll just send a few more."),
  L(9, 'The Accidental Group Chat', 'Find Bobby’s "I love you" in the group chat and unsend it.', 'I meant to text one button. I texted twenty.'),
  L(10, 'First Match: The Power Button', 'Find your way through the dark date: table, menu, then her.', "She's beautiful. Every time I touch her the lights go out. Is that a sign?"),
  // Chapter 3
  L(11, 'The Pickup Line Generator', 'Spin the wheels until Bella is mildly amused.', "Bella. The one. She's never looked at me. Today she looks at me."),
  L(12, 'Become Tall', "Stack blocks under Bobby until he reaches Bella's eye level.", "She's tall. I'm 48 pixels. Simple fix: be taller."),
  L(13, 'The Romantic Dance', 'Hit the arrows as they reach the line.', 'I took one dance lesson. In a dream. Let’s go.'),
  L(14, 'Chad the Toggle Arrives', "Repeat Chad's flex sequence back to beat him.", "Oh no. It's Chad. He has ON/OFF relationships. And abs."),
  L(15, 'Rejected in 4K', "Catch the pieces of Bobby's heart.", 'She said no. In 4K. With HDR.'),
  // Chapter 4
  L(16, 'Bobby Goes to the Gym', 'Click the dumbbells as fast as you can.', "New plan. Get huge. Women love huge buttons."),
  L(17, 'Become an Alpha Button', 'Pick the advice cards. Every one is terrible.', 'I paid 400 coins for this seminar. I will become ALPHA.'),
  L(18, 'Delete Chad', 'Drag Chad into the recycle bin, then empty it before he toggles back.', 'Chad must go. Respectfully. Into the bin.'),
  L(19, 'Evil Laugh Training', 'Hold and release to match the evil laugh wave.', 'Every villain needs a laugh. Mine is still in beta.'),
  L(20, 'The Revenge Plan', 'Build the trap for Chad out of UI parts.', 'The plan is perfect. Nothing can go wrong. Nothing.'),
  // Chapter 5
  L(21, 'Dating a Checkbox', 'Check the right date options before she unchecks them.', "She's a checkbox. She can't decide. I respect that. I also can't."),
  L(22, 'Dating a Slider', 'Keep every slider inside her (moving) standards.', 'Her standards keep moving. Literally. They slide.'),
  L(23, 'Dating a Loading Spinner', 'Stop each clock right on time.', "She's always late. Like, buffering late."),
  L(24, 'Dating a Popup', 'Find the real her among the popups. Mind the close buttons.', 'Every time I get close she disappears. Very popup of her.'),
  L(25, 'Speed Dating Championship', 'Five dates, sixty seconds. Pick the right answer for each.', 'Five dates. One minute. I trained for this my whole life (yesterday).'),
  // Chapter 6
  L(26, 'Why Is My Heart Beating?', 'Move your cursor close to Bobby. Find out what is going on.', 'Something is wrong with me. My heart does a thing. Probably a virus.'),
  L(27, 'Stop Looking at Me Like That', "Cover Bobby's face. He keeps peeking.", "Don't hover over me. I'm blushing. I'm NOT blushing. Stop it."),
  L(28, 'The Accidental Kiss', 'Help Bobby pretend nothing happened.', 'Nothing happened. Nothing happened. NOTHING HAPPENED.'),
  L(29, 'Am I in Love With an Arrow?', 'Take the personality test. Answer honestly. It will not matter.', 'I’m taking a test. Purely scientific. Not about you. At all.'),
  L(30, 'The Confession', 'Catch the falling words in the right order.', 'I have to tell you something. I need the right words. They keep falling.'),
  // Chapter 7
  L(31, 'Come Back, Baby!', 'Keep your cursor away from Bobby for 20 seconds.', 'WHY ARE YOU RUNNING. I JUST WANT TO TALK. AND HOLD HANDS.'),
  L(32, 'Cursor Dating Simulator', 'Decorate the date spot for the cursor.', "I'm planning a date for you. Do you think it likes me? Don't answer."),
  L(33, 'The Jealous Button', 'Use the controls. Bobby will try to block them.', 'Who is that checkbox. Why are you hovering it. WHO IS SHE.'),
  L(34, 'Hold My Hand', 'Keep your cursor next to Bobby through the course.', "Hold my hand. Don't let go. I'll fall over. Dramatically."),
  L(35, 'The First Date', 'Feed Bobby pixels. Dodge the interruptions.', 'Candlelight. Pixels. You. This is the best day of my life.'),
  // Chapter 8
  L(36, 'The Proposal', 'Answer him.', 'I know it’s been 4 levels. But when you know, you know.'),
  L(37, 'Meet My Parents', 'Follow the etiquette rules of Enter and Escape.', 'My parents are keys. Very traditional. Enter is strict. Escape keeps leaving.'),
  L(38, 'Wedding Planner.exe', 'Put the guests in their seats. They will not stay.', 'The fanciest ceremony in computer history. Seating chart is mandatory.'),
  L(39, 'The Ex-Girlfriend Returns', 'Help Bobby answer without insulting anyone.', "Bella's here. And Chad. In a bridesmaid dress. Why."),
  L(40, 'The Wedding That Never Happened', 'Click Confirm. Not Cancel. CONFIRM.', 'Last step. One button. I am literally a button. I got this.'),
  // Chapter 9
  L(41, 'Cursor Goes Missing', 'Follow the footprints and find the notes.', 'Where did you go? There are footprints. Glowing ones. Romantic AND creepy.'),
  L(42, 'The Search Party', 'Use each friend’s ability to clear the path.', 'I assembled a team. A checkbox, a slider and a spinner. The best of the internet.'),
  L(43, 'The Heartbreak Boss', 'Dodge the error popups. Click the three weak points.', 'A giant 404 LOVE NOT FOUND. Ugh. Not him again.'),
  L(44, 'The Apology', 'Fix his apology. Autocorrect is not helping.', 'I need to say sorry. Properly. My keyboard has other ideas.'),
  L(45, 'One Last Chance', "Don't move. Let it come to him.", "I'll be patient. I'll just sit here. Calmly. Is it here yet. No. OK. Calm."),
  // Chapter 10
  L(46, 'The Second First Date', 'Collect the stars to draw the constellation.', 'No tricks. No chasing. Just stars. And you. If that’s OK.'),
  L(47, 'The Antivirus Arrives', 'Escape the antivirus traps and reach Bobby.', 'UNAUTHORIZED LOVE BETWEEN UI ELEMENTS?? Rude.'),
  L(48, 'The Love.exe Boss Fight', 'Bobby blocks, you attack the weak points.', 'It turned into a giant robot. Of course it did. Together?'),
  L(49, 'Will You Click Me Forever?', 'Choose.', 'I have one question. Whatever you say, I’m happy you’re here.'),
  L(50, 'Happily Ever After.exe', 'Help Bobby give his first lesson.', 'Years later. I am now a world famous relationship coach. My first student is here.'),
];

export const LEVEL = Object.fromEntries(LEVELS.map((l) => [l.id, l]));
export const LAST = LEVELS.length;
export const isChapterEnd = (id) => id % 5 === 0;
