/*
  Varna - A Privacy-Preserving Marketplace
  Varna uses Fully Homomorphic Encryption to make markets fair. 
  Copyright (C) 2021 Enya Inc. Palo Alto, CA

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import networkService from 'services/networkService'
import { createAction } from './createAction'

export function fetchAirdropStatusL1() {return createAction('FETCH/AIRDROPL1/STATUS', ()=>networkService.fetchAirdropStatusL1())}
export function fetchAirdropStatusL2() {return createAction('FETCH/AIRDROPL2/STATUS', ()=>networkService.fetchAirdropStatusL2())}

export function initiateAirdrop() {return createAction('AIRDROP/INITIATE',()=>{return networkService.initiateAirdrop()})}

export function getAirdropL1(callData) {return createAction('AIRDROPL1/CREATE',()=>{return networkService.getAirdropL1(callData)})}
export function getAirdropL2(callData) {return createAction('AIRDROPL2/CREATE',()=>{return networkService.getAirdropL2(callData)})}