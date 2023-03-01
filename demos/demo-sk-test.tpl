<!DOCTYPE html>
<html lang="{if $inLang}{$inLang}{else}{$smarty.const.LANG}{if $smarty.const.LANG == 'en'}-us{/if}{/if}">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">
</head><body>
<tr class="detailed-team-stats">
                                    <td class="headcol cric-headcol">
                                        <span class="team-stats-flag-text">vs</span>
                                        {if {$ranking["team_flag"]}} 
                                            <img class="team-image battting" src="{$ranking["team_flag"]}" onerror="this.src='{$smarty.const.STATIC_URL}/football_images/shield.png'">
                                        {else}
                                            <img class="team-image battting" src="{$smarty.const.STATIC_URL}/football_images/shield.png">
                                        {/if}
                                        {if {$ranking['sk_slug']} }
                                            <a target="_blank" {if {$ranking['sk_slug']}}href="https://sportskeeda.com/team/{$ranking['sk_slug']}{/if}">{$ranking["team_name"]}</a>
                                        {else}
                                            <a>{$ranking["team_name"]}</a>
                                        {/if}
                                    </td>
</body></html>
