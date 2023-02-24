<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <div class="container">
    <button>Button</button>
    <img src="demo1.png"/>
    <img src="demo2.png"/>
    <div>v0.0.5 validate</div>
    <div>{{$v}}</div>
    {foreach from=$collection item=item key=key name=name}
      <a>anchor changed 9</a>
    {/foreach}
  </div>
</body>
</html>
