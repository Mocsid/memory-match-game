// functions/controllers/gameController.js
const { db } = require('../services/firebaseService');

const generateCards = () => {
    const numPairs = 8; // 8 pairs = 16 cards
    const cards = [];

    for (let i = 0; i < numPairs; i++) {
        const randomId = Math.floor(Math.random() * 1000); // Use a different random ID for each image
        const imageUrl = `https://picsum.photos/id/${randomId}/100/100`; // Get a 100x100 image

        // Create two of each card (a pair)
        cards.push({
            value: imageUrl, // The image URL is the 'value' for matching
            isFlipped: false,
            matched: false,
        });
        cards.push({
            value: imageUrl,
            isFlipped: false,
            matched: false,
        });
    }

    // Shuffle the cards (Fisher-Yates shuffle)
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
};

exports.joinGame = async (req, res) => {
    const { userId } = req.body;

    try {
        // 1. Check if the user is ALREADY in an active game (pending or in_progress)
        const existingGames = await db.collection('matches')
            .where('players', 'array-contains', userId)
            .where('status', 'in', ['pending', 'in_progress'])
            .get();

        if (!existingGames.empty) {
            return res.status(400).json({ success: false, error: "User already in a game or queue." });
        }

        // 2. Look for a PENDING game (waiting for a second player)
        const pendingGames = await db.collection('matches')
            .where('status', '==', 'pending')
            .limit(1)
            .get();

        if (pendingGames.empty) {
            // 3. NO PENDING GAME: Create a NEW 'pending' game
            const newGameRef = await db.collection('matches').add({
                players: [userId],  // Add the current user
                status: 'pending',   // Mark as waiting for another player
                createdAt: new Date(),
            });
            return res.status(200).json({ success: true, matchId: newGameRef.id, message: 'Waiting for opponent' });

        } else {
            // 4. PENDING GAME FOUND: Join the existing game
            const gameDoc = pendingGames.docs[0];
            const gameData = gameDoc.data();

            // Prevent user from joining the same game twice (shouldn't happen with step 1, but good to check)
            if (gameData.players.includes(userId)) {
                return res.status(400).json({ success: false, error: 'User is already in this game.' });
            }

            // 5. Update the game: Add the player, set to 'in_progress', initialize game state
            const cards = generateCards(); // Generate cards *only* when starting the game
            await gameDoc.ref.update({
                players: [...gameData.players, userId],  // Add the second player
                status: 'in_progress',                // VERY IMPORTANT: Change status to start the game
                cards: cards,                         // Initialize the cards
                flippedIndices: [],                    // No cards flipped initially
                currentPlayerIndex: 0,                  // Player 0 (the first player) starts
                scores: {},                            // Initialize scores
            });

            return res.status(200).json({ success: true, matchId: gameDoc.id, message: 'Match found!' });
        }
    } catch (error) {
        console.error("Error joining game:", error);
        res.status(500).json({ success: false, error: "Failed to join game." });
    }
};

exports.cancelQueue = async (req, res) => {
    const { userId } = req.body;

    try {
        // Find pending games where the user is a player
        const pendingGames = await db.collection('matches')
            .where('players', 'array-contains', userId)
            .where('status', '==', 'pending')
            .get();

        if (pendingGames.empty) {
            return res.status(404).json({ success: false, error: "You were not in the queue." });
        }

        // Delete the pending game(s) - in this setup, there should only be one
        const deletePromises = pendingGames.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        return res.status(200).json({ success: true, message: "You have been removed from the queue." });

    } catch (error) {
        console.error("Error canceling queue:", error);
        res.status(500).json({ success: false, error: "Failed to cancel queue." });
    }
};