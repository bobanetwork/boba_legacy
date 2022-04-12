import {isTestEnv} from "@turing/react-app/src/utils/environment.utils";

const addressesTestnet = {
  TuringHelper: '0xA00f82C6fe87E81ab3501A21c47227e84e3d9C48',
  TuringHelperFactory: '0x3243cf5504de1BCa82f072BeE9735f51027AC062',
  BobaToken: '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309',
};

const addressesMainnet = {
  // TODO
  TuringHelper: '',
  TuringHelperFactory: '',
  BobaToken: '',
}
export default isTestEnv() ? addressesTestnet : addressesMainnet;
