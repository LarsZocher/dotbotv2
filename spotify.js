import SpotifyWebApi from 'spotify-web-api-node';
import express from 'express';
import fs from 'fs';
import publicIp from 'public-ip';
import Bot from './bot.js';

// permissions to request
const scopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
];

class SpotifyWeb {
    spotifyApi;
    expressApp;

    registerIntents() {
        const overrideResult = (result) => {
            result = result.replaceAll('was von', '');
            result = result.replaceAll('von', '');
            result = result.replaceAll('rafka Mora', 'Raf Camora');
            result = result.replaceAll(/\s{2,}/g, ' ');
            return result;
        };

        Bot.getInstance().da.onIntent('SPOTIFY_PLAY_TRACK', async (result) => {
            let track = '';
            //console.log(result.parameters.fields.any.listValue.values);
            if (result.parameters.fields.any.kind === 'listValue')
                track = result.parameters.fields.any.listValue.values.map(v => v.stringValue).join(' ');
            if (result.parameters.fields.any.kind === 'stringValue') track = result.parameters.fields.any.stringValue;
            track = overrideResult(track);
            console.log('[SpotifyWeb] Requested track:', track);
            await this.playTrack(track);
        });
        Bot.getInstance().da.onIntent('SPOTIFY_PLAY_ARTIST', async (result) => {
            let artist = '';
            //console.log(result.parameters.fields.any.listValue.values);
            if (result.parameters.fields.any.kind === 'listValue')
                artist = result.parameters.fields.any.listValue.values.map(v => v.stringValue).join(' ');
            if (result.parameters.fields.any.kind === 'stringValue') artist = result.parameters.fields.any.stringValue;
            artist = overrideResult(artist);
            console.log('[SpotifyWeb] Reqested artist:', artist);
            await this.playArtist(artist);
        });
    }

    async start() {
        const redirectURL = process.env.SPOTIFY_REDIRECT_URI || 'http://' + (await publicIp.v4()) + ':5001/callback';

        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: redirectURL
        });

        this.expressApp = express();
        this.expressApp.get('/login', (req, res) => {
            res.redirect(this.spotifyApi.createAuthorizeURL(scopes));
        });
        this.expressApp.get('/callback', (req, res) => {
            const error = req.query.error;
            const code = req.query.code;

            if (error) {
                console.error('[SpotifyWeb] Callback Error:', error);
                res.send(`Callback Error: ${error}`);
                return;
            }

            this.spotifyApi
                .authorizationCodeGrant(code)
                .then((data) => {
                    const access_token = data.body['access_token'];
                    const refresh_token = data.body['refresh_token'];
                    const expires_in = data.body['expires_in'];

                    this.spotifyApi.setAccessToken(access_token);
                    this.spotifyApi.setRefreshToken(refresh_token);

                    console.log('[SpotifyWeb] access_token:', access_token);
                    console.log('[SpotifyWeb] refresh_token:', refresh_token);

                    this.saveRefreshToken(refresh_token);

                    console.log(`[SpotifyWeb] Sucessfully retreived access token. Expires in ${expires_in} s.`);
                    res.send('Success! You can now close the window.');

                    setInterval(() => this.refreshAccessToken, (expires_in / 2) * 1000);
                })
                .catch((error) => {
                    console.error('[SpotifyWeb] Error getting Tokens:', error);
                    res.send(`Error getting Tokens: ${error}`);
                });
        });
        // Wait for the server to start listening
        await new Promise((res) =>
            this.expressApp.listen(5001, async () => {
                console.log('[SpotifyWeb] HTTP Server up.');
                await this.authenticate();
                res();
            })
        );
    }

    async refreshAccessToken() {
        const data = await this.spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];

        console.log('[SpotifyWeb] The access token has been refreshed!');
        console.log('[SpotifyWeb] access_token:', access_token);
        this.spotifyApi.setAccessToken(access_token);
    }

    async authenticate() {
        if (fs.existsSync('./access_token.json')) {
            let data = JSON.parse(fs.readFileSync('./access_token.json'));
            this.spotifyApi.setRefreshToken(data.refresh_token);
            console.log('[SpotifyWeb] Access token loaded from file.');

            setInterval(() => this.refreshAccessToken(), 1000 * 60 * 30);
            await this.refreshAccessToken();
        } else {
            const host = process.env.SPOTIFY_HOST || 'http://' + (await publicIp.v4());
            console.log('[SpotifyWeb] No access token found. Please login at ' + host + ':5001/login');
        }
    }

    saveRefreshToken(refresh_token) {
        fs.writeFileSync('./access_token.json', JSON.stringify({ refresh_token }));
    }

    async checkActiveDevice() {
        let devices = await this.spotifyApi.getMyDevices();
        let noActiveDevice = devices.body.devices.every((device) => !device.is_active);
        if (devices.body.devices.length === 0) {
            console.log('[SpotifyWeb] No devices found.');
            return false;
        }
        if (noActiveDevice) {
            await this.spotifyApi.transferMyPlayback([devices.body.devices[0].id]);
        }
    }

    async playTrack(track) {
        try {
            await this.checkActiveDevice();
            let data = await this.spotifyApi.searchTracks(track);
            if (data.body.tracks.items.length == 0) {
                console.log('[SpotifyWeb] No track found.');
                return;
            }
            console.log('[SpotifyWeb] Search by track:', track);
            console.log('[SpotifyWeb] Tracks:', data.body.tracks.items[0].uri);
            this.spotifyApi.play({
                uris: [data.body.tracks.items[0].uri]
            });
        } catch (e) {
            console.log('[SpotifyWeb] Error:', e);
        }
    }

    async playArtist(artist) {
        await this.checkActiveDevice();
        let data = await this.spotifyApi.searchArtists(artist);
        if (data.body.artists.items.length == 0) {
            console.log('[SpotifyWeb] No artist found.');
            return;
        }
        let tracks = await this.spotifyApi.getArtistTopTracks(data.body.artists.items[0].id, 'DE');
        let randomTrack = tracks.body.tracks[Math.floor(Math.random() * tracks.body.tracks.length)];
        if (!randomTrack) {
            console.log('[SpotifyWeb] No track found.');
            return;
        }
        console.log('[SpotifyWeb] Search by Artist:', artist);
        console.log('[SpotifyWeb] Tracks:', randomTrack.uri);
        this.spotifyApi.play({
            uris: [randomTrack.uri]
        });
    }
}

export default SpotifyWeb;
