const db = require('../config/db');

const toggleVote = async (req, res) => {
    const { type } = req.body;
    const priceId = req.params.priceId;

    if (!['upvote', 'downvote'].includes(type)) {
        return res.status(400).json({ message: 'Type de vote invalide (upvote ou downvote attendu)' });
    }

    try {
        // Vérifier si le prix existe
        const [prices] = await db.query('SELECT * FROM Price WHERE id = ?', [priceId]);
        if (prices.length === 0) {
            return res.status(404).json({ message: 'Prix non trouvé' });
        }

        const priceAuthorId = prices[0].user_id;
        const currentStatus = prices[0].status;

        // Fonction utilitaire pour mettre à jour la réputation
        const updateReputation = async (userId, points) => {
            if (!userId) return; // Si le prix n'a pas d'auteur (ex: utilisateur supprimé)
            await db.query('UPDATE User SET reputation = reputation + ? WHERE id = ?', [points, userId]);
        };

        // Vérifier si un vote existe déjà
        const [existingVotes] = await db.query(
            'SELECT * FROM Vote WHERE user_id = ? AND price_id = ?',
            [req.user.id, priceId]
        );

        let responseMessage = '';
        let statusCode = 200;

        if (existingVotes.length > 0) {
            const currentVote = existingVotes[0];
            
            if (currentVote.type === type) {
                // Annuler le vote (supprimer)
                await db.query('DELETE FROM Vote WHERE id = ?', [currentVote.id]);
                
                // Impact réputation (Annulation)
                const impact = type === 'upvote' ? -5 : 2;
                await updateReputation(priceAuthorId, impact);

                responseMessage = 'Vote annulé';
            } else {
                // Inverser le vote (mettre à jour)
                await db.query('UPDATE Vote SET type = ? WHERE id = ?', [type, currentVote.id]);
                
                // Impact réputation (Inversion)
                const impact = type === 'upvote' ? 7 : -7;
                await updateReputation(priceAuthorId, impact);

                responseMessage = `Vote changé en ${type}`;
            }
        } else {
            // Créer un nouveau vote
            await db.query(
                'INSERT INTO Vote (type, user_id, price_id) VALUES (?, ?, ?)',
                [type, req.user.id, priceId]
            );
            
            // Impact réputation (Nouveau vote)
            const impact = type === 'upvote' ? 5 : -2;
            await updateReputation(priceAuthorId, impact);

            statusCode = 201;
            responseMessage = `Vote enregistré : ${type}`;
        }

        // --- VERIFICATION DU STATUT DU PRIX ---
        const [voteStats] = await db.query(`
            SELECT 
                COUNT(CASE WHEN type = 'upvote' THEN 1 END) as upvotes,
                COUNT(CASE WHEN type = 'downvote' THEN 1 END) as downvotes
            FROM Vote WHERE price_id = ?
        `, [priceId]);
        
        const score = voteStats[0].upvotes - voteStats[0].downvotes;
        let newStatus = currentStatus;

        if (currentStatus === 'pending' && score >= 2) {
            newStatus = 'active';
            await db.query("UPDATE Price SET status = 'active' WHERE id = ?", [priceId]);
        } else if (currentStatus !== 'rejected' && score <= -3) {
            newStatus = 'rejected';
            await db.query("UPDATE Price SET status = 'rejected' WHERE id = ?", [priceId]);
        }

        return res.status(statusCode).json({ 
            message: responseMessage,
            newStatus: newStatus,
            score: score
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { toggleVote };
