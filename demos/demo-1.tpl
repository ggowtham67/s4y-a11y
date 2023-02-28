<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">
  <title>Document</title>
</head>
<body>
  <div class="container">
    <button>Button</button>
    <img src="{$smarty.const.STATIC_URL}/demo1.png"/>
    <img src="demo2.png"/>
    <div>{{$v}}</div>
    {foreach from=$collection item=item key=key name=name}
      <a>anchor changed 13</a>
    {/foreach}
  </div>
</body>
</html>
