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
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
      <div class="relative w-full max-w-md animate-[modal-appear_0.3s_ease-out] rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <button class="absolute right-4 top-4 cursor-pointer border-none bg-transparent p-2 text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={closeModal}>
          ×
        </button>

        <div class="text-center">
          <h2 class="m-0 mb-1 text-xl font-semibold text-gray-800 dark:text-gray-100">{$t('login.title')}</h2>
          <p class="mb-8 text-sm text-gray-500 dark:text-gray-400">{$t('login.subtitle')}</p>

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
            <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <span class="px-3 text-sm text-gray-500 dark:text-gray-400">{$t('login.other_login')}</span>
            <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
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
              class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800" 
              onClick={handleLinuxdoLogin} 
              title={$t('login.linuxdo')}
            >
              <img src={linuxdoIcon} alt="Linux.do" class="w-5 h-5" />
            </button>
          </div>

          <p class="mt-6 text-xs text-gray-500 dark:text-gray-400">
            {$t('login.terms_prefix')}
            <a href="#" class="text-blue-500 hover:underline dark:text-blue-300">{$t('login.terms')}</a> {$t('login.and')}
            <a href="#" class="text-blue-500 hover:underline dark:text-blue-300">{$t('login.privacy')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
