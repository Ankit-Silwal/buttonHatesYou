// The whole Button story, told in order. Each part's premise is always
// readable; each chapter's retelling unlocks once the player has finished
// that chapter in the game (see Story.jsx for how progress is read).
//
//   save     localStorage key the game writes; done[n] marks chapter n finished
//   href     where the Play button goes

export const SERIES = [
  {
    id: 'cursor',
    order: 'Part 1',
    title: 'How I Met Your Cursor',
    href: '/games/how-i-met-your-cursor',
    save: 'buttonHatesYou.cursor.v1',
    unit: 'Chapter',
    color: '#ffb38a',
    premise:
      'Before Button hated you, you were the best wingman he ever had. A hopeless red button named Bobby meets a cursor who points at things for a living, picks up a best friend who is literally the Tab key, and falls for the pink button selling flowers at the market. This is the funny part. Everything good that happens to Bobby, he gets with your help.',
    chapters: [
      {
        title: 'A Button, A Cursor, and Zero Brain Cells',
        text: [
          'Bobby is lying face-down in the grass under a floating sign that says PRESS TO START, so a passing cursor does exactly that. Bobby screams. The cursor screams back. Bobby explains, loudly, that being a button does not mean you can press his face without asking. The cursor explains that his whole personality is pointing at things. Bobby decides, on the spot, that they are going to be friends.',
          'Cursor turns out to be useful. He drags a plank into place so Bobby can climb a wall, clicks open the lock on a treasure chest, and stays polite about Bobby’s "legendary" wooden sword, which has a crack down the middle. The treasure is one coin. Bobby announces he is buying a house.',
          'Tabby the Tab key drops out of a tree, asks who the triangle is, calls Cursor’s name terrible, gets told his own name is Tab, and welcomes Cursor to the gang. Then, at the market, Bobby sees Bella selling flowers. Rose petals fall. He walks toward her, trips over a single pixel, and lands in a bin. When she asks if he’s okay, the bin says: "YES. I LIVE HERE." Cursor and Tabby promise to help. New main quest: find Bobby a girlfriend. Difficulty: impossible.',
        ],
      },
      {
        title: 'Operation: Get a Girlfriend',
        text: [
          'Tabby designs a three-part training program. Part one, become handsome: Bobby puts on whatever you hand him, from sunglasses that cover his whole face to a golden mustache that moves on its own, a marker six-pack, grass hair and a cape reading ALPHA BUTTON. Tabby says he looks incredible. Cursor says he looks like a traffic light with depression.',
          'Part two, become rich: Bella’s flowers cost five coins, and the coins in the nearby field have grown legs and run away. A giant piggy bank called the Tax Collector blocks the exit and demands ninety percent of Bobby’s earnings as an unemployment tax. Bobby smashes its armour, Cursor hits the reset switch on its back, and the refund comes to fifty coins. Bobby plans to buy Bella the moon.',
          'Part three, learn to flirt: Tabby offers three pickup lines, and Bobby ignores your choice and yells the worst one: "PLEASE MARRY ME." Bella asks his name and suggests he start with hello. "HELLO. PLEASE MARRY ME." She laughs, calls him ridiculous, and says it’s a maybe, to coffee. Bobby faints. Tabby says it is the happiest he has ever seen him.',
        ],
      },
      {
        title: 'The Worst First Date Ever',
        text: [
          'Bobby arrives at Le Click wearing a bow tie larger than his body, with Cursor and Tabby hiding by the door and talking him through an earpiece. He carries soup through a gauntlet of waiters, survives a conversation while his nervousness meter climbs, and discovers the bill includes a breathing fee, so Cursor searches behind paintings and under potted plants for coins.',
          'Then popups invade the restaurant, led by Karen Popup, who demands to speak to the manager. Bobby is on a date. Karen wants a refund. Bobby wants a girlfriend, and as he points out, they can’t all get what they want. Halfway through the fight Bella jumps in, throwing flowers like weapons. "You thought I just sold flowers?" "YES." "That’s adorable."',
          'Afterwards they sit by a fountain. Bella says he’s a disaster, but that he tried really hard to make the day special, and it worked, a little. She kisses him on the cheek. Bobby turns pink and freezes. BOBBY.EXE HAS STOPPED RESPONDING. They are officially dating.',
        ],
      },
      {
        title: 'The Great Love Rescue',
        text: [
          'There are happy dates. Bella teaches Bobby her family soup recipe. It is objectively not good, and he eats every drop. Bobby wants to give her something that will never disappear: the Forever Bloom, a flower that grows in the Glitchy Forest, among Caps Lock Bats, Autocorrect Slimes, Lag Spiders and Spam Bees.',
          'Bella secretly follows them, and at the Bloom a purple error named Lord 404 snatches both her and the flower. Love does not exist, he says, because his girlfriend left him for a better internet connection. Cursor finds this fair. Three copies of Lord 404 blink around the arena, and only Cursor can find the real one. At low health he starts sobbing that she said he wasn’t available. Bobby points out that he is literally Error 404. Bella breaks out of the cage herself and throws him into a bush.',
          'Bobby gives her the Bloom: it will never fade, because Cursor spent three hours fixing its code. Bella says she loves it, and then, for the first time, that she loves him. "CURSOR. TABBY. SHE SAID THE THING." The Forever Bloom goes into a vase by their window.',
        ],
      },
      {
        title: 'Operation: Marry Bella',
        text: [
          'Months pass. Bobby and Bella move into a little house, and Tabby keeps visiting without knocking. Bobby decides to propose and, once again, has no money. Cursor suggests they could find a ring. Bobby says that sounds illegal. Tabby says only if someone owns it. A jeweler tells them about a silver ring lost in the old mine.',
          'The mine has living gold coins, paperclip worms and CAPTCHA guardians, and the ring is guarded by a golem made of CAPTCHA tiles. It asks Bobby to prove he isn’t a robot. He is a button. It asks him to select all the traffic lights. They are in a cave. He passes by selecting every star, then hits it while it glitches.',
          'At sunset, on the hill above Clicktopia, Bobby gets down on one knee and opens an empty box. Tabby thought Cursor had the ring. Cursor thought Tabby had it. The ring rolls downhill toward the river, and Bobby chases it all the way down. He comes back panting: "WILL YOU PLEASE MARRY ME BEFORE SOMETHING ELSE GOES WRONG?" Bella says yes. "YES, IDIOT!" Tabby sets off a firework launcher by accident and covers the hill in smoke. Love is explosive, bro.',
        ],
      },
      {
        title: 'The Wedding Disaster',
        text: [
          'Cursor is best man. Tabby organised the ceremony, which was a mistake. Giant ants steal the cake, and Bobby chases them through the village because they have no respect for marriage. Tabby invited the whole kingdom, so the Tax Collector wants a registration fee, Lord 404 cries, and Karen complains about the seating plan. Cursor sorts the guests, and then ERROR 500, the Wedding Crasher, comes through the roof. "SERVICE UNAVAILABLE." "MY WEDDING IS VERY MUCH AVAILABLE." Cursor finds its weak spots, Tabby throws wedding gifts at it, Bella throws flowers, and Bobby finishes it.',
          'A checkbox priest marries them. Bella says yes, unfortunately. Before the kiss, Bobby turns to Cursor: "We actually did it. Thanks for helping me. You’re my best friend." Tabby gasps. "ONE OF MY BEST FRIENDS." "Better."',
          'A few days later, in their new house, under a framed wedding photo of all four of them, Bobby breaks a table while assembling it with his sword. Bella gives him a little silver heart pendant: a reminder that no matter where he goes, someone is waiting for him at home. As Cursor leaves, Bobby calls after him: if anything ever happens, you’ll look after her, right? You answer: "I promise." The screen reads FRIENDSHIP SAVED SUCCESSFULLY. Then, almost too fast to see: UNKNOWN PROCESS CONNECTED. ADMIN.EXE.',
        ],
      },
    ],
  },
  {
    id: 'reason',
    order: 'Part 2',
    title: 'The Reason',
    href: '/games/the-reason',
    save: 'buttonHatesYou.reason.v1',
    unit: 'Episode',
    color: '#e2674f',
    premise:
      'Why Button hates you. Bobby, Bella and Tabby are living happily in Clicktopia when a giant cursor appears in the sky and a voice called THE ADMIN asks the Player to save the kingdom. For the first half, you believe you are helping. You are not. This is the sad part, and at the end Bobby has to decide whether to destroy the person he blames, or trust them one last time.',
    chapters: [
      {
        title: 'A Button With a Life',
        text: [
          'Rain on the window. Bella wakes Bobby up for work; he argues that time and employment are both social constructs; she throws a pillow. He finds the coins he always drops under the bed, fixes the shelf, buys a wooden sword from the market, fights the bugs eating Bella’s flowers, and meets Tabby, who still dreams of being a knight.',
          'Bella fastens the silver heart pendant around Bobby’s neck: if you ever get lost, this will remind you where home is. He says he’s going to the market, not to war, and promises he’ll come back. Then the sky flickers, and an enormous cursor appears above the kingdom. For the first time, somebody outside their world has started touching it.',
        ],
      },
      {
        title: 'The First Click',
        text: [
          'A new Player has connected. Bobby discovers that someone else can move his legs: he tries to walk left and gets moved right, into a bush. Tabby is thrilled. On the road out of town the forest is full of corrupted things, like checkbox crabs, popup bats and loading slimes, and a broken guardian robot warns them that THE ADMIN is purging unnecessary elements, which means all of them.',
          'An old monitor flickers on. A faceless figure says it has been expecting the Player, and that only the Player can save this world by collecting three Core Fragments. Bobby doesn’t like his voice. Tabby says he’s literally called Admin, so he probably knows what he’s doing.',
        ],
      },
      {
        title: 'Two Idiots and a Sword',
        text: [
          'The Popup Forest. A merchant called FREE TRIAL sells Bobby a double jump and a sword that bills him when the trial runs out. A treasure chest turns out to be a popup. A cookie monster won’t let them cross until somebody accepts cookies. Tabby attacks a signpost and declares a boss defeated. Then they beat a real one, THE UNSKIPPABLE AD, by finding its tiny grey close button.',
          'The first fragment. THE ADMIN congratulates them. That night, by a campfire, Tabby asks what Bobby will do when this is over. Go home, he says, and eat Bella’s terrible soup. He hates her soup, but he likes eating it with her. There is one marshmallow left, and you decide who gets it.',
        ],
      },
      {
        title: 'The Forgotten Kingdom',
        text: [
          'A deserted city, its houses cut out of existence in perfect rectangles. Names float where people used to live: Button_001, Button_002, User_Not_Found. An old Backspace key explains that the Admin once kept things tidy, then wanted to decide everything, and began calling anyone who said no "corrupted data". He never destroyed anything himself. He made someone else press the button.',
          'Memory crystals replay the past: a cursor hesitating between KEEP and DELETE, a village vanishing house by house, and a log that ends AUTHORIZATION: PLAYER. Bobby asks you if you’re sure you’re doing the right thing. You answer, and he keeps going anyway. They take the second fragment, and the sky turns slightly red. Far away, the shield around Bobby’s village has started to fail.',
        ],
      },
      {
        title: 'The Truth Beneath the Code',
        text: [
          'Under the Server Tower, recordings from the kingdom’s original protectors explain what the fragments really are: pieces of a firewall. Apart, they protect the kingdom. Brought together in the Admin’s tower, they become a key that switches every protection off. Tabby works it out first. They aren’t collecting a weapon; they are handing over the keys to the entire kingdom.',
          'The Admin cuts in to call the recordings corrupted. Bobby gets a dash, and for the first time refuses an order: he will not pick up the last fragment. He agrees to carry it only so nobody else can take it to the Admin. Then Bella calls. She made his favourite soup. It isn’t his favourite, he says, he just eats it every day, because she is his favourite. He tells her he’ll be home soon.',
        ],
      },
      {
        title: 'The Last Laugh',
        text: [
          'The Admin turns the tower against them: alarms, collapsing bridges, security drones, and a giant garbage truck that calls them unreferenced objects. They escape all of it, until the Admin starts a full purge and the final bridge falls away behind them. The escape gate can only be held open from the inside.',
          '"Someone’s gotta hold the gate." Bobby tells him not to. Tabby tells him to take care of Bella, and to tell her that Tabby was the cooler one. "You weren’t." "Liar." He lets go. Then there is silence. Bobby walks through an empty forest where Tabby would have been making jokes, finds Tabby’s chipped wooden sword in the grass, and says he used to hate how much Tabby talked. It’s too quiet now.',
        ],
      },
      {
        title: 'The False Choice',
        text: [
          'Bobby climbs the Admin’s tower alone. The fragments are torn out of his bag into a lock the Admin still can’t open by himself. He needs outside authorization. A giant screen offers two emergency protocols while the kingdom’s integrity counts down. Bobby looks up at you. He doesn’t trust the Admin. He already lost Tabby. He begs you not to make him lose anyone else.',
          'You pick one. Both routes were rigged. PLAYER COMMAND ACCEPTED. PURGE INITIATED. The kingdom turns red. "What… did you just do?" The Admin laughs and thanks the Player. You have been most useful.',
        ],
      },
      {
        title: 'The Day Everything Died',
        text: [
          'Bobby walks home through the village from the first episode, past everything he passed that morning, all of it ruined. Tabby’s house is empty. Bella’s flowers are dead. The front door of Bobby’s own house is lying in the garden, and the wedding photo is cracked on the wall.',
          'Bella is under the broken shelf he fixed that morning, still awake. "You’re late." She made soup. He says he’ll fix this, because he always does. She asks him to sit with her instead, and asks if he saved the world. He doesn’t know. That’s okay, she says. He’s home, and that’s enough. She sees he kept the pendant. Then her light goes out, and the pendant cracks. A Retry button appears, and nothing happens when it is pressed. Bobby turns toward the screen: I trusted you. Tabby trusted you. She trusted you. And you pressed it. I HATE YOU.',
        ],
      },
      {
        title: 'I Hate You',
        text: [
          'The Player becomes a cursor, and Bobby becomes the boss, using every move you taught him: the combo, the dash, Tabby’s slam. He screams that you were so good at controlling him, so why can’t you control this, and starts to cry halfway through. At the end he charges one enormous strike. You choose whether to dodge or stand still. Either way, he stops.',
          'His error screen reads like a breakdown: memory corrupted, trust not found, she said she was happy I came home. Then a memory chip falls out of his pocket. Tabby slipped it there before the gate. His recording explains that both choices were traps, that the Player’s permission was all the Admin needed, and that the Player isn’t Bobby’s enemy, because the Admin used both of you.',
          '"So you didn’t know?" "No." "You still pressed it." "I did." He can’t forgive you yet, but he can’t stop the Admin alone. Together, with Bella’s pendant restoring the firewall, they bring the Admin down. Offered Bella back in exchange for control, Bobby refuses: you don’t get to take her from me twice. Weeks later, on the hill where he once proposed, there are two memorials. He leaves Tabby’s sword between them, hangs the pendant on Bella’s, and thanks you for staying. Then you reach for him with the cursor, and he jumps away: "HEY! PERSONAL SPACE!" For the first time since Bella died, he laughs.',
        ],
      },
    ],
  },
  {
    id: 'please-dont',
    order: 'Part 3',
    title: 'The Button That Hates You',
    href: '/games/please-dont',
    save: 'pleaseDont.v1',
    unit: 'Game',
    color: '#9bbf9a',
    premise:
      'Today. Bobby lives alone in a little room, and you are the person who keeps trying to press him. He runs, he hides, he calls his friends, he makes fake buttons, and if you push him far enough he picks up a sword. He is sarcastic and furious and, if you know the story, completely understandable.',
    chapters: [
      {
        title: 'Please Don’t',
        text: [
          'Now you know why he runs from the cursor: the last time he trusted one, he lost his home. He cries when his house breaks because he remembers coming home and finding Bella under the ruins. He calls for friends because he misses Tabby. He makes decoy buttons because that is how he learned to survive the purge. The angry sword-swinging boss is the form he took when he fought you. And he remembers you, because the Admin’s corrupted memory left him unable to forget.',
          'He is still friendly, sometimes. He made his peace with the Player, but old habits remain. Click him enough and you might start to understand what he means when he says he promised someone he’d come home.',
        ],
      },
    ],
  },
];

// Not part of the main timeline: a what-if comedy about Bobby before he met
// anyone. Its chapters come straight from the game's own level list.
export const SIDE = {
  id: 'love',
  order: 'Side story',
  title: 'Desperate for Love',
  href: '/games/desperate-for-love',
  save: 'buttonHatesYou.love.v1',
  color: '#ff8fb1',
  premise:
    'A what-if, outside the main story: Bobby has been single for 404 days and you are his wingman across fifty levels of dating apps, villain arcs and terrible romance. It doesn’t have to fit the timeline. It only has to be funny.',
};
