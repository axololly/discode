import { Client } from 'discord-rpc';

export async function start() {
    const client = new Client({
        transport: 'ipc'
    });

    client.on('ready', () => {
        console.log(`Authed for user ${client.user!.username!}`);

        console.log("Setting activity...");

        let base = "C:/Users/james.griggs/Desktop/i hate programming pt 2/typescript projects/my-own-rpc-thingy"

        console.log(`Path: file://${base}/200.png`);

        client.setActivity({
            largeImageKey: `file:///${base}/200.png`,
            largeImageText: "C++ is doodoo powder",
            
            startTimestamp: 1741654563,
            details: "why wont this bug go awayyyyy"
        });

        console.log("Activity set!");
    });

    client.login({
        clientId: '783070621679747123',
        // scopes: ['rpc', 'rpc.activities.write']
    });

    /*
    export interface Presence {
        state?: string | undefined;
        details?: string | undefined;
        startTimestamp?: number | Date | undefined;
        endTimestamp?: number | Date | undefined;
        largeImageKey?: string | undefined;
        largeImageText?: string | undefined;
        smallImageKey?: string | undefined;
        smallImageText?: string | undefined;
        instance?: boolean | undefined;
        partyId?: string | undefined;
        partySize?: number | undefined;
        partyMax?: number | undefined;
        matchSecret?: string | undefined;
        spectateSecret?: string | undefined;
        joinSecret?: string | undefined;
        buttons?: Array<{ label: string; url: string }> | undefined;
    }
    */
}