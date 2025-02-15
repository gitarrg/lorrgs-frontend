import { defineConfig, loadEnv } from 'vite';
import { execSync } from 'child_process';

// Plugins
import react from '@vitejs/plugin-react';
import { VitePluginRadar } from 'vite-plugin-radar'


/**
 * Retrieves the latest Git commit hash and timestamp.
 *
 * @returns {Object} An object containing:
 *   - `commitHash` (string): The short hash of the latest commit.
 *   - `commitDate` (string): The ISO 8601 formatted commit timestamp.
 *   If an error occurs, both values will be 'unknown'.
 */
function getGitInfo() {
    try {
        const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
        const commitDate = execSync('git log -1 --format=%cd --date=iso-strict').toString().trim();
        return { commitHash, commitDate };
    } catch (error) {
        console.error('[getGitInfo][Error] Failed to retrieve commit info:', error);
        return { commitHash: 'unknown', commitDate: 'unknown' };
    }
}


// Config
export default defineConfig(({ mode }) => {

    const env = loadEnv(mode, process.cwd());
    const { commitHash, commitDate } = getGitInfo();

    //**************************************************************************
    return {

        build: {
            outDir: "build",
        },

        plugins: [
            react(),

            // Add Google Analytics Tracking
            // disabled by default in development mode
            // https://github.com/stafyniaksacha/vite-plugin-radar?tab=readme-ov-file#options
            VitePluginRadar({
                analytics: {
                    id: env.VITE_GOOGLE_ANALYTICS_ID,
                },
            }),

        ], // end: plugins

        define: {
            "GIT_COMMIT_HASH": JSON.stringify(commitHash),
            "GIT_COMMIT_DATE": JSON.stringify(commitDate),
        },

        server: {
            port: 9001,
        }
    }
});
