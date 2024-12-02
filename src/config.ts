/*
 * Copyright (C) 2024 Duksing Chau
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const config = {
    mis: {
        requiredRoles: ['nobles', 'mahjongers'],
    },
    times: {
        SLEEPCHECK_CHECK_PERIOD: 15 * 60 * 1000,
        SLEEPCHECK_SAVE_PERIOD: 1 * 60 * 60 * 1000,
        GAME_HANGMAN_GAMETIME: 15 * 60 * 100,
    },
    ids: {
        BIGBROTHER: "1263997983637114880"
    }
};

export default config;
