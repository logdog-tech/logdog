import { useTranslate } from '@tolgee/vue';
import wechatIcon from '@/assets/wechat-icon.svg';
import githubIcon from '@/assets/github-icon.svg';
import linuxdoIcon from '@/assets/linuxdo-icon.png';


export default function LoginModal(props: {
  modelValue: boolean;
}, { emit }: { emit: (event: 'update:modelValue', value: boolean) => void }) {
  
    const {t} = useTranslate();

    const $t = (key: string) => t.value(key);

  const closeModal = () => {
    emit('update:modelValue', false);
  };

  const handleWechatLogin = () => {
    window.location.href = "https://api.logdog.tech/login?redirect_url=" + window.location.href;
  };

  const handleLinuxdoLogin = () => {
    const debugClientId = "0zjnSRcIJ4kwusuVleRcfgEbVE90H5f8";
    const onlineClientId = "nVAdQBve5N82hqyWIJ9WCHwoG63Hz0BS";

    const clientId = window.location.hostname === "localhost" || 
                      window.location.hostname === "127.0.0.1" || 
                      window.location.hostname === "0.0.0.0" ? debugClientId : onlineClientId;
    window.location.href = `https://connect.linux.do/oauth2/authorize?response_type=code&client_id=${clientId}&state=ttt1` + window.location.href;
  };

  const handleGithubLogin = async () => {
    const githubClientId = "Ov23liqILuMhl2F37bvi";
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=read:user`;
  };

  if (!props.modelValue) return null;

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={closeModal}>
      <div class="bg-white rounded-xl p-8 w-full max-w-md relative animate-[modal-appear_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <button class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl border-none bg-transparent cursor-pointer p-2" onClick={closeModal}>
          ×
        </button>

        <div class="text-center">
          <h2 class="text-xl font-semibold text-gray-800 m-0 mb-1">{$t('login.title')}</h2>
          <p class="text-gray-500 text-sm mb-8">{$t('login.subtitle')}</p>

          <div class="flex flex-col mb-6">
            <button 
              class="flex items-center justify-center gap-3 py-3 px-4 bg-[#07C160] hover:bg-[#06B057] text-white rounded-lg w-full transition-colors" 
              onClick={handleWechatLogin}
            >
              <img src={wechatIcon} alt="WeChat" class="w-5 h-5" />
              {$t('login.wechat')}
            </button>
          </div>

          <div class="flex items-center my-6">
            <div class="flex-1 h-px bg-gray-200"></div>
            <span class="px-3 text-sm text-gray-500">{$t('login.other_login')}</span>
            <div class="flex-1 h-px bg-gray-200"></div>
          </div>

          <div class="flex justify-center gap-4 my-6">
            <button 
              class="w-10 h-10 rounded-full flex items-center justify-center bg-[#24292e] hover:bg-[#2f363d] transition-colors" 
              onClick={handleGithubLogin} 
              title={$t('login.github')}
            >
              <img src={githubIcon} alt="GitHub" class="w-5 h-5" />
            </button>
            <button 
              class="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors" 
              onClick={handleLinuxdoLogin} 
              title={$t('login.linuxdo')}
            >
              <img src={linuxdoIcon} alt="Linux.do" class="w-5 h-5" />
            </button>
          </div>

          <p class="text-xs text-gray-500 mt-6">
            {$t('login.terms_prefix')}
            <a href="#" class="text-blue-500 hover:underline">{$t('login.terms')}</a> {$t('login.and')}
            <a href="#" class="text-blue-500 hover:underline">{$t('login.privacy')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}