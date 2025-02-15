import { defineConfig, loadEnv } from 'vite';
import { execSync } from 'child_process';

// Plugins
import { visualizer } from "rollup-plugin-visualizer";
import { VitePluginRadar } from 'vite-plugin-radar'
import react from '@vitejs/plugin-react';


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
            target: "es2015",
            outDir: "build",

            rollupOptions: {
                treeshake: true,
                output: {

                    manualChunks(id) {

                        if (id.includes('/node_modules/konva')) {
                            return "vendor__konva";
                        }
                        if (id.includes('/node_modules/react')) {
                            return "vendor__react"
                        }

                        return null
                    }
                }

                //...
            }

        },

        esbuild: {
            drop: ['console', 'debugger'],
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

            // rollup-plugin-visualizer
            // needs to be the last plugin in the list
            visualizer({
                open: false,
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
