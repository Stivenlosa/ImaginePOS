"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { useLanguage, LANGUAGES, type LanguageCode } from "@/i18n";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LogOutIcon, SettingsIcon, UserIcon, LanguageIcon } from "./icons";

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const USER = {
    name: "Stiven Lopez",
    email: "johnson@nextadmin.com",
    img: "/images/user/user-05.png",
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    setLanguage(lang);
    setShowLanguageSelector(false);
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">{t("userInfo.myAccount")}</span>

        <figure className="flex items-center gap-3">
          <Image
            src={USER.img}
            className="size-12"
            alt={`Avatar of ${USER.name}`}
            role="presentation"
            width={200}
            height={200}
          />
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{USER.name}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">{t("userInfo.userInformation")}</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <Image
            src={USER.img}
            className="size-12"
            alt={`Avatar for ${USER.name}`}
            role="presentation"
            width={200}
            height={200}
          />

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {USER.name}
            </div>

            <div className="leading-none text-gray-6">{USER.email}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />

            <span className="mr-auto text-base font-medium">{t("userInfo.viewProfile")}</span>
          </Link>

          <Link
            href={"/pages/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              {t("userInfo.accountSettings")}
            </span>
          </Link>

          {/* Language Selector */}
          <div className="relative">
            <button
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            >
              <LanguageIcon />

              <span className="mr-auto text-base font-medium">
                {t("userInfo.language")}
              </span>
              
              <span className="text-sm">
                {LANGUAGES[language].flag} {LANGUAGES[language].nativeName}
              </span>
              
              <ChevronUpIcon
                aria-hidden
                className={cn(
                  "size-4 rotate-180 transition-transform",
                  showLanguageSelector && "rotate-0",
                )}
                strokeWidth={1.5}
              />
            </button>

            {showLanguageSelector && (
              <div className="mt-1 ml-8 space-y-1 pb-2">
                {(Object.entries(LANGUAGES) as [LanguageCode, typeof LANGUAGES[LanguageCode]][]).map(
                  ([code, { nativeName, flag }]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                        language === code
                          ? "bg-primary/10 text-primary dark:bg-primary/20"
                          : "hover:bg-gray-2 dark:hover:bg-dark-3"
                      )}
                    >
                      <span>{flag}</span>
                      <span>{nativeName}</span>
                      {language === code && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <LogOutIcon />

            <span className="text-base font-medium">{t("userInfo.logOut")}</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
